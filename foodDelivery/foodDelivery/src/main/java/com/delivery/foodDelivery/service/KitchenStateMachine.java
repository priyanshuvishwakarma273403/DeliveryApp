package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.enums.KitchenState;
import com.delivery.foodDelivery.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
public class KitchenStateMachine {

    private static final Map<KitchenState, Set<KitchenState>> ALLOWED_TRANSITIONS = new EnumMap<>(KitchenState.class);

    static {
        // OPEN transitions
        ALLOWED_TRANSITIONS.put(KitchenState.OPEN, Set.of(
                KitchenState.PREPARING, KitchenState.BUSY, KitchenState.PAUSED, KitchenState.CLOSING, KitchenState.MAINTENANCE
        ));
        // PREPARING transitions
        ALLOWED_TRANSITIONS.put(KitchenState.PREPARING, Set.of(
                KitchenState.OPEN, KitchenState.BUSY, KitchenState.OVERLOADED, KitchenState.PAUSED, KitchenState.MAINTENANCE
        ));
        // BUSY transitions
        ALLOWED_TRANSITIONS.put(KitchenState.BUSY, Set.of(
                KitchenState.PREPARING, KitchenState.OVERLOADED, KitchenState.PAUSED, KitchenState.MAINTENANCE
        ));
        // OVERLOADED transitions
        ALLOWED_TRANSITIONS.put(KitchenState.OVERLOADED, Set.of(
                KitchenState.BUSY, KitchenState.PREPARING, KitchenState.PAUSED, KitchenState.MAINTENANCE
        ));
        // PAUSED transitions
        ALLOWED_TRANSITIONS.put(KitchenState.PAUSED, Set.of(
                KitchenState.OPEN, KitchenState.PREPARING, KitchenState.BUSY, KitchenState.MAINTENANCE
        ));
        // CLOSING transitions
        ALLOWED_TRANSITIONS.put(KitchenState.CLOSING, Set.of(
                KitchenState.CLOSED, KitchenState.MAINTENANCE
        ));
        // CLOSED transitions
        ALLOWED_TRANSITIONS.put(KitchenState.CLOSED, Set.of(
                KitchenState.OPEN, KitchenState.MAINTENANCE
        ));
        // MAINTENANCE transitions
        ALLOWED_TRANSITIONS.put(KitchenState.MAINTENANCE, Set.of(
                KitchenState.CLOSED, KitchenState.OPEN
        ));
    }

    public boolean isTransitionAllowed(KitchenState current, KitchenState next) {
        if (current == next) {
            return true;
        }
        Set<KitchenState> allowed = ALLOWED_TRANSITIONS.get(current);
        return allowed != null && allowed.contains(next);
    }

    public void validateTransition(KitchenState current, KitchenState next) {
        if (!isTransitionAllowed(current, next)) {
            log.error("Invalid kitchen state transition attempted: {} -> {}", current, next);
            throw new BusinessException("Invalid kitchen state transition: " + current + " -> " + next);
        }
    }
}
