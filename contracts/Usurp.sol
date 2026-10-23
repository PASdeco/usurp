// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title USURP Game Contract
/// @author USURP
/// @notice King-of-the-hill style game paid in USDC on Arc Testnet.
/// @dev All monetary values are denominated in 6-decimal USDC units.
contract Usurp is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Starting steal price in USDC 6-decimal units.
    uint256 public constant START_PRICE = 130_000;
    /// @notice Price increase applied after each steal, in basis points.
    uint256 public constant PRICE_INCREASE_BPS = 2_000;
    /// @notice Maximum steal price in USDC 6-decimal units.
    uint256 public constant PRICE_CAP = 5_000_000;
    /// @notice Split to fee accumulator, in basis points.
    uint256 public constant SPLIT_BPS = 5_000;
    /// @notice Drip reward per interval for current holder, in basis points of holderStealPrice.
    uint256 public constant DRIP_BPS = 200;
    /// @notice Length of a single drip interval in seconds.
    uint256 public constant DRIP_INTERVAL = 30;
    /// @notice Time without steals after which reset is allowed.
    uint256 public constant IDLE_RESET_TIME = 3_600;
    /// @notice Time with empty pot after which reset is allowed.
    uint256 public constant EMPTY_RESET_TIME = 600;
    /// @notice Default minimum hold shield duration before another steal can happen.
    uint256 public constant MIN_HOLD_BEFORE_STEAL = 0;
    /// @notice Default low-pot threshold in number of drip intervals.
    uint256 public constant POT_LOW_THRESHOLD_INTERVALS = 5;
    /// @notice Reference minimum seed amount in USDC 6-decimal units.
    uint256 public constant MIN_SEED = 1_000_000;
    /// @notice Timelock delay for mutable parameter changes.
    uint256 public constant PARAM_TIMELOCK = 2 days;

    /// @notice Address of the USDC token used for all game payments.
    address public immutable USDC;

    /// @notice Current crown holder.
    address public holder;
    /// @notice Current price required to steal the crown.
    uint256 public currentPrice;
    /// @notice Pot balance tracked for drip rewards.
    uint256 public pot;
    /// @notice Timestamp when the last steal happened.
    uint256 public lastStealTime;
    /// @notice Price paid by current holder at time of steal.
    uint256 public holderStealPrice;
    /// @notice Timestamp from which drip accrual is measured for current holder.
    uint256 public accrualStart;
    /// @notice Claimable earnings by address.
    mapping(address => uint256) public pending;
    /// @notice Current round number; increments only on reset.
    uint256 public round;
    /// @notice Address entitled to withdraw accrued fee split.
    address public feeAddress;
    /// @notice Pull-based accumulated fees available to withdraw.
    uint256 public feeAccrued;
    /// @notice Timestamp when pot became empty; zero means not currently empty.
    uint256 public potEmptySince;
    /// @notice Authorized caller for Phase 2 crown-award hook.
    address public authorizedCaller;

    /// @notice Mutable hold shield duration before a new steal is allowed.
    uint256 public minHoldBeforeSteal;
    /// @notice Mutable low-pot threshold measured in drip intervals.
    uint256 public potLowThresholdIntervals;

    /// @notice Scheduled parameter change container.
    /// @param value Encoded target value.
    /// @param effectiveAt Timestamp when change can be applied.
    struct PendingParam {
        uint256 value;
        uint256 effectiveAt;
    }

    /// @notice Snapshot of game state for frontends.
    struct GameStateView {
        address holder;
        uint256 currentPrice;
        uint256 pot;
        uint256 lastStealTime;
        uint256 holderStealPrice;
        uint256 accrualStart;
        uint256 round;
        address feeAddress;
        uint256 feeAccrued;
        bool paused;
        uint256 potEmptySince;
        address authorizedCaller;
        uint8 potHealthValue;
    }

    /// @notice Pending feeAddress change.
    PendingParam public pendingFeeAddress;
    /// @notice Pending minHoldBeforeSteal change.
    PendingParam public pendingMinHoldBeforeSteal;
    /// @notice Pending potLowThresholdIntervals change.
    PendingParam public pendingPotLowThresholdIntervals;
    /// @notice Pending authorizedCaller change.
    PendingParam public pendingAuthorizedCaller;

    /// @notice Thrown when current price exceeds user-provided slippage cap.
    error SlippageExceeded();
    /// @notice Thrown when caller already holds the crown.
    error AlreadyHolder();
    /// @notice Thrown when hold-shield timer is still active.
    error HoldShieldActive();
    /// @notice Thrown when there is nothing to claim.
    error NothingToClaim();
    /// @notice Thrown when reset conditions are not met.
    error ResetNotEligible();
    /// @notice Thrown when caller is not authorized.
    error Unauthorized();
    /// @notice Thrown when a required address is zero.
    error ZeroAddress();
    /// @notice Thrown when there are no fees to withdraw.
    error NoFeesToWithdraw();
    /// @notice Thrown when requested update would not change state or conflicts with active pending change.
    error NoChange();
    /// @notice Thrown when a pending change timelock is not yet elapsed.
    error TimelockNotElapsed();
    /// @notice Thrown when no pending change exists.
    error NoPendingChange();

    /// @notice Emitted when the crown is stolen.
    /// @param newHolder New holder after steal.
    /// @param prevHolder Previous holder before steal.
    /// @param pricePaid Amount paid in USDC.
    /// @param nextPrice New required steal price after increase.
    /// @param round Current round number.
    event Stolen(address indexed newHolder, address indexed prevHolder, uint256 pricePaid, uint256 nextPrice, uint256 round);
    /// @notice Emitted when an address claims pending rewards.
    /// @param holder Recipient address.
    /// @param amount Claimed amount.
    event Claimed(address indexed holder, uint256 amount);
    /// @notice Emitted when a new round starts after reset.
    /// @param round New round number.
    /// @param timestamp Reset timestamp.
    event RoundReset(uint256 indexed round, uint256 timestamp);
    /// @notice Emitted when owner seeds the pot.
    /// @param amount Seed amount.
    /// @param newPot Pot value after seeding.
    event PotSeeded(uint256 amount, uint256 newPot);
    /// @notice Emitted when accrued fees are withdrawn.
    /// @param to Fee recipient.
    /// @param amount Withdrawn fee amount.
    event FeesWithdrawn(address indexed to, uint256 amount);
    /// @notice Emitted when fee address change is scheduled.
    /// @param newFeeAddress Pending new fee address.
    /// @param effectiveAt Earliest apply timestamp.
    event FeeAddressChangeScheduled(address indexed newFeeAddress, uint256 effectiveAt);
    /// @notice Emitted when fee address change is applied.
    /// @param newFeeAddress Applied fee address.
    event FeeAddressChanged(address indexed newFeeAddress);
    /// @notice Emitted when min hold change is scheduled.
    /// @param newValue Pending min hold seconds.
    /// @param effectiveAt Earliest apply timestamp.
    event MinHoldChangeScheduled(uint256 newValue, uint256 effectiveAt);
    /// @notice Emitted when min hold change is applied.
    /// @param newValue Applied min hold seconds.
    event MinHoldChanged(uint256 newValue);
    /// @notice Emitted when pot low threshold change is scheduled.
    /// @param newValue Pending threshold value.
    /// @param effectiveAt Earliest apply timestamp.
    event PotLowThresholdChangeScheduled(uint256 newValue, uint256 effectiveAt);
    /// @notice Emitted when pot low threshold change is applied.
    /// @param newValue Applied threshold value.
    event PotLowThresholdChanged(uint256 newValue);
    /// @notice Emitted when authorized caller change is scheduled.
    /// @param newCaller Pending authorized caller.
    /// @param effectiveAt Earliest apply timestamp.
    event AuthorizedCallerChangeScheduled(address indexed newCaller, uint256 effectiveAt);
    /// @notice Emitted when authorized caller change is applied.
    /// @param newCaller Applied authorized caller.
    event AuthorizedCallerChanged(address indexed newCaller);
    /// @notice Emitted when phase-2 hook awards crown.
    /// @param winner New holder selected by authorized caller.
    /// @param authorizedCaller Authorized caller address.
    event CrownAwarded(address indexed winner, address indexed authorizedCaller);
    /// @notice Emitted when holder drip is settled into pending rewards.
    /// @param holder Holder whose drip was settled.
    /// @param amount Amount settled.
    event DripSettled(address indexed holder, uint256 amount);

    /// @notice Creates the USURP game instance.
    /// @param _feeAddress Initial fee recipient.
    /// @param _usdc USDC token address.
    constructor(address _feeAddress, address _usdc) Ownable(msg.sender) {
        if (_feeAddress == address(0) || _usdc == address(0)) revert ZeroAddress();
        assert(SPLIT_BPS <= 5_000);

        feeAddress = _feeAddress;
        USDC = _usdc;

        currentPrice = START_PRICE;
        round = 1;
        minHoldBeforeSteal = MIN_HOLD_BEFORE_STEAL;
        potLowThresholdIntervals = POT_LOW_THRESHOLD_INTERVALS;
    }

    /// @notice Renouncing ownership is disabled to prevent permanently bricking pause/unpause.
    function renounceOwnership() public pure override {
        revert Unauthorized();
    }

    /// @notice Steal the crown by paying the current price in USDC.
    /// @param maxPrice Caller slippage ceiling for currentPrice.
    function steal(uint256 maxPrice) external nonReentrant whenNotPaused {
        address prevHolder = holder;
        uint256 pricePaid = currentPrice;

        if (pricePaid > maxPrice) revert SlippageExceeded();
        if (prevHolder == msg.sender) revert AlreadyHolder();
        if (minHoldBeforeSteal > 0 && block.timestamp < lastStealTime + minHoldBeforeSteal) {
            revert HoldShieldActive();
        }

        _settleHolderDrip(prevHolder);

        uint256 feeAmt = (pricePaid * SPLIT_BPS) / 10_000;
        uint256 potAmt = pricePaid - feeAmt;

        feeAccrued += feeAmt;
        pot += potAmt;
        _syncPotEmptySince();

        holder = msg.sender;
        holderStealPrice = pricePaid;
        lastStealTime = block.timestamp;
        accrualStart = block.timestamp;

        uint256 bumped = (pricePaid * (10_000 + PRICE_INCREASE_BPS)) / 10_000;
        currentPrice = bumped > PRICE_CAP ? PRICE_CAP : bumped;

        IERC20(USDC).safeTransferFrom(msg.sender, address(this), pricePaid);

        emit Stolen(msg.sender, prevHolder, pricePaid, currentPrice, round);
    }

    /// @notice Claim accumulated rewards for caller.
    /// @dev Works while paused.
    function claim() external nonReentrant {
        if (msg.sender == holder) {
            _settleHolderDrip(msg.sender);
        }

        uint256 claimable = pending[msg.sender];
        if (claimable == 0) revert NothingToClaim();

        pending[msg.sender] = 0;
        IERC20(USDC).safeTransfer(msg.sender, claimable);

        emit Claimed(msg.sender, claimable);
    }

    /// @notice Reset round if idle or empty-pot timeout condition is met.
    function reset() external nonReentrant whenNotPaused {
        bool idleEligible = block.timestamp >= lastStealTime + IDLE_RESET_TIME;
        bool emptyEligible = potEmptySince != 0 && block.timestamp >= potEmptySince + EMPTY_RESET_TIME;

        if (!idleEligible && !emptyEligible) revert ResetNotEligible();

        _settleHolderDrip(holder);

        holder = address(0);
        currentPrice = START_PRICE;
        round += 1;
        accrualStart = 0;
        holderStealPrice = 0;
        lastStealTime = block.timestamp;
        potEmptySince = 0;

        emit RoundReset(round, block.timestamp);
    }

    /// @notice Seed additional USDC into the pot.
    /// @param amount Amount of USDC to deposit.
    function seedPot(uint256 amount) external onlyOwner {
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amount);
        pot += amount;

        if (potEmptySince != 0 && pot > 0) {
            potEmptySince = 0;
            accrualStart = block.timestamp;
        }

        emit PotSeeded(amount, pot);
    }

    /// @notice Withdraw accumulated fees to feeAddress.
    function withdrawFees() external nonReentrant {
        if (msg.sender != feeAddress && msg.sender != owner()) revert Unauthorized();
        if (feeAccrued == 0) revert NoFeesToWithdraw();

        uint256 amt = feeAccrued;
        feeAccrued = 0;

        IERC20(USDC).safeTransfer(feeAddress, amt);

        emit FeesWithdrawn(feeAddress, amt);
    }

    /// @notice Schedule fee recipient address update.
    /// @param newFeeAddress New fee address to apply after timelock.
    function setFeeAddress(address newFeeAddress) external onlyOwner {
        if (newFeeAddress == address(0)) revert ZeroAddress();
        if (newFeeAddress == feeAddress || pendingFeeAddress.effectiveAt != 0) revert NoChange();

        uint256 effectiveAt = block.timestamp + PARAM_TIMELOCK;
        pendingFeeAddress = PendingParam({value: uint256(uint160(newFeeAddress)), effectiveAt: effectiveAt});

        emit FeeAddressChangeScheduled(newFeeAddress, effectiveAt);
    }

    /// @notice Apply scheduled fee recipient update after timelock.
    function applyFeeAddress() external onlyOwner {
        PendingParam memory change = pendingFeeAddress;
        if (change.effectiveAt == 0) revert NoPendingChange();
        if (block.timestamp < change.effectiveAt) revert TimelockNotElapsed();

        address newFeeAddress = address(uint160(change.value));
        feeAddress = newFeeAddress;
        delete pendingFeeAddress;

        emit FeeAddressChanged(newFeeAddress);
    }

    /// @notice Schedule hold-shield update.
    /// @param newValue New minimum hold duration in seconds.
    function setMinHoldBeforeSteal(uint256 newValue) external onlyOwner {
        if (newValue == minHoldBeforeSteal || pendingMinHoldBeforeSteal.effectiveAt != 0) revert NoChange();

        uint256 effectiveAt = block.timestamp + PARAM_TIMELOCK;
        pendingMinHoldBeforeSteal = PendingParam({value: newValue, effectiveAt: effectiveAt});

        emit MinHoldChangeScheduled(newValue, effectiveAt);
    }

    /// @notice Apply scheduled hold-shield update after timelock.
    function applyMinHoldBeforeSteal() external onlyOwner {
        PendingParam memory change = pendingMinHoldBeforeSteal;
        if (change.effectiveAt == 0) revert NoPendingChange();
        if (block.timestamp < change.effectiveAt) revert TimelockNotElapsed();

        minHoldBeforeSteal = change.value;
        delete pendingMinHoldBeforeSteal;

        emit MinHoldChanged(minHoldBeforeSteal);
    }

    /// @notice Schedule low-pot threshold update.
    /// @param newValue New threshold in drip intervals.
    function setPotLowThresholdIntervals(uint256 newValue) external onlyOwner {
        if (newValue == potLowThresholdIntervals || pendingPotLowThresholdIntervals.effectiveAt != 0) revert NoChange();

        uint256 effectiveAt = block.timestamp + PARAM_TIMELOCK;
        pendingPotLowThresholdIntervals = PendingParam({value: newValue, effectiveAt: effectiveAt});

        emit PotLowThresholdChangeScheduled(newValue, effectiveAt);
    }

    /// @notice Apply scheduled low-pot threshold update after timelock.
    function applyPotLowThresholdIntervals() external onlyOwner {
        PendingParam memory change = pendingPotLowThresholdIntervals;
        if (change.effectiveAt == 0) revert NoPendingChange();
        if (block.timestamp < change.effectiveAt) revert TimelockNotElapsed();

        potLowThresholdIntervals = change.value;
        delete pendingPotLowThresholdIntervals;

        emit PotLowThresholdChanged(potLowThresholdIntervals);
    }

    /// @notice Pause gameplay functions that require `whenNotPaused`.
    function pause() external onlyOwner whenNotPaused {
        _pause();
    }

    /// @notice Unpause gameplay functions.
    function unpause() external onlyOwner whenPaused {
        _unpause();
    }

    /// @notice PHASE 2 HOOK — unaudited. Must be security-reviewed before enabling authorizedCaller.
    /// @param winner New holder to assign without payment.
    function awardCrown(address winner) external nonReentrant whenNotPaused {
        if (authorizedCaller == address(0) || msg.sender != authorizedCaller) revert Unauthorized();
        if (winner == address(0)) revert ZeroAddress();

        _settleHolderDrip(holder);

        holder = winner;
        accrualStart = block.timestamp;
        holderStealPrice = currentPrice;

        emit CrownAwarded(winner, msg.sender);
    }

    /// @notice Schedule authorized caller update for phase-2 hook.
    /// @param caller New authorized caller (can be zero to disable).
    function setAuthorizedCaller(address caller) external onlyOwner {
        if (caller == authorizedCaller || pendingAuthorizedCaller.effectiveAt != 0) revert NoChange();

        uint256 effectiveAt = block.timestamp + PARAM_TIMELOCK;
        pendingAuthorizedCaller = PendingParam({value: uint256(uint160(caller)), effectiveAt: effectiveAt});

        emit AuthorizedCallerChangeScheduled(caller, effectiveAt);
    }

    /// @notice Apply scheduled authorized caller update after timelock.
    function applyAuthorizedCaller() external onlyOwner {
        PendingParam memory change = pendingAuthorizedCaller;
        if (change.effectiveAt == 0) revert NoPendingChange();
        if (block.timestamp < change.effectiveAt) revert TimelockNotElapsed();

        address caller = address(uint160(change.value));
        authorizedCaller = caller;
        delete pendingAuthorizedCaller;

        emit AuthorizedCallerChanged(caller);
    }

    /// @notice Return current game state snapshot.
    /// @return state Struct containing key game fields and pot health.
    function getState() external view returns (GameStateView memory state) {
        state = GameStateView({
            holder: holder,
            currentPrice: currentPrice,
            pot: pot,
            lastStealTime: lastStealTime,
            holderStealPrice: holderStealPrice,
            accrualStart: accrualStart,
            round: round,
            feeAddress: feeAddress,
            feeAccrued: feeAccrued,
            paused: paused(),
            potEmptySince: potEmptySince,
            authorizedCaller: authorizedCaller,
            potHealthValue: _potHealth()
        });
    }

    /// @notice Returns claimable amount including unsettled drip if `addr` is current holder.
    /// @param addr Address to query.
    /// @return amount Claimable amount in USDC units.
    function earnedSoFar(address addr) external view returns (uint256 amount) {
        amount = pending[addr];
        if (addr == holder) {
            (, uint256 accrued,) = _previewDrip(addr);
            amount += accrued;
        }
    }

    /// @notice Returns next timestamp at which another drip interval completes.
    /// @return ts Timestamp for next drip settlement boundary, or 0 if no holder.
    function nextDripAt() external view returns (uint256 ts) {
        if (holder == address(0) || accrualStart == 0) return 0;

        uint256 elapsed = block.timestamp - accrualStart;
        uint256 rem = elapsed % DRIP_INTERVAL;
        ts = rem == 0 ? block.timestamp + DRIP_INTERVAL : block.timestamp + (DRIP_INTERVAL - rem);
    }

    /// @notice Returns estimated timestamp when holder reaches 100% break-even.
    /// @dev Assumes pot remains funded for future intervals.
    /// @return ts Estimated timestamp, or 0 if unavailable.
    function breakEvenAt() external view returns (uint256 ts) {
        address currentHolder = holder;
        if (currentHolder == address(0)) return 0;

        uint256 target = holderStealPrice;
        uint256 earned = pending[currentHolder];
        (, uint256 accrued,) = _previewDrip(currentHolder);
        earned += accrued;

        if (earned >= target) return block.timestamp;

        uint256 dripPerInterval = (holderStealPrice * DRIP_BPS) / 10_000;
        if (dripPerInterval == 0) return 0;

        uint256 remaining = target - earned;
        uint256 intervalsNeeded = (remaining + dripPerInterval - 1) / dripPerInterval;
        ts = block.timestamp + (intervalsNeeded * DRIP_INTERVAL);
    }

    /// @notice Reports health category of the pot.
    /// @return value 0=Healthy, 1=Low, 2=Empty.
    function potHealth() external view returns (uint8 value) {
        value = _potHealth();
    }

    /// @notice Settles holder drip into pending rewards.
    /// @param _holder Holder whose drip should be settled.
    function _settleHolderDrip(address _holder) internal {
        if (_holder == address(0) || accrualStart == 0) {
            _syncPotEmptySince();
            return;
        }

        (uint256 intervals, uint256 amount, uint256 newAccrualStart) = _previewDrip(_holder);
        if (intervals > 0) {
            accrualStart = newAccrualStart;
        }

        if (amount > 0) {
            pending[_holder] += amount;
            pot -= amount;
            emit DripSettled(_holder, amount);
        }

        _syncPotEmptySince();
    }

    /// @notice Preview drip settlement math for holder.
    /// @param _holder Holder to preview.
    /// @return intervals Number of whole intervals elapsed.
    /// @return amount Drip amount that can be paid from pot.
    /// @return newAccrualStart Updated accrual start after settling elapsed intervals.
    function _previewDrip(address _holder)
        internal
        view
        returns (uint256 intervals, uint256 amount, uint256 newAccrualStart)
    {
        if (_holder == address(0) || accrualStart == 0 || block.timestamp <= accrualStart) {
            return (0, 0, accrualStart);
        }

        intervals = (block.timestamp - accrualStart) / DRIP_INTERVAL;
        newAccrualStart = accrualStart;

        if (intervals == 0 || pot == 0) {
            return (intervals, 0, newAccrualStart + (intervals * DRIP_INTERVAL));
        }

        uint256 dripPerInterval = (holderStealPrice * DRIP_BPS) / 10_000;
        if (dripPerInterval == 0) {
            return (intervals, 0, newAccrualStart + (intervals * DRIP_INTERVAL));
        }

        uint256 requested = intervals * dripPerInterval;
        amount = requested > pot ? pot : requested;
        newAccrualStart = accrualStart + (intervals * DRIP_INTERVAL);
    }

    /// @notice Synchronizes `potEmptySince` according to current pot value.
    function _syncPotEmptySince() internal {
        if (pot == 0) {
            if (potEmptySince == 0) {
                potEmptySince = block.timestamp;
            }
        } else if (potEmptySince != 0) {
            potEmptySince = 0;
        }
    }

    /// @notice Computes pot health category.
    /// @return value 0=Healthy, 1=Low, 2=Empty.
    function _potHealth() internal view returns (uint8 value) {
        if (pot == 0) return 2;

        uint256 dripPerInterval = (holderStealPrice * DRIP_BPS) / 10_000;
        uint256 threshold = dripPerInterval * potLowThresholdIntervals;

        if (pot < threshold) return 1;
        return 0;
    }
}
