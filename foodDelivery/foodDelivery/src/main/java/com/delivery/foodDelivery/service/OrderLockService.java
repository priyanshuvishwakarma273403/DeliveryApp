package com.delivery.foodDelivery.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderLockService {

    private final StringRedisTemplate redisTemplate;
    private final ConcurrentHashMap<String, Boolean> localLocks = new ConcurrentHashMap<>();

    private boolean isRedisAvailable() {
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean acquireLock(String lockKey, long expireSeconds) {
        try {
            if (isRedisAvailable()) {
                Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", expireSeconds, TimeUnit.SECONDS);
                return success != null && success;
            }
        } catch (Exception e) {
            log.warn("Redis locking failed: {}. Falling back to in-memory locking.", e.getMessage());
        }
        
        // In-memory fallback
        return localLocks.putIfAbsent(lockKey, Boolean.TRUE) == null;
    }

    public void releaseLock(String lockKey) {
        try {
            if (isRedisAvailable()) {
                redisTemplate.delete(lockKey);
                return;
            }
        } catch (Exception e) {
            log.warn("Redis lock release failed: {}.", e.getMessage());
        }
        
        localLocks.remove(lockKey);
    }
}
