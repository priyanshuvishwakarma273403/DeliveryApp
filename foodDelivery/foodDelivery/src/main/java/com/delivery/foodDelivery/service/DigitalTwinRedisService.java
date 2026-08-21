package com.delivery.foodDelivery.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class DigitalTwinRedisService {

    private final StringRedisTemplate redisTemplate;
    
    // In-memory fallback map when Redis is unavailable or disabled
    private final ConcurrentHashMap<String, String> localCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<Long>> localWindows = new ConcurrentHashMap<>();

    private boolean isRedisAvailable() {
        try {
            // Test connection quickly
            redisTemplate.getConnectionFactory().getConnection().ping();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void put(String key, String value, long timeoutSeconds) {
        try {
            if (isRedisAvailable()) {
                redisTemplate.opsForValue().set(key, value, timeoutSeconds, TimeUnit.SECONDS);
                return;
            }
        } catch (Exception e) {
            log.warn("Redis write failure for key {}: {}. Falling back to in-memory cache.", key, e.getMessage());
        }
        localCache.put(key, value);
    }

    public String get(String key) {
        try {
            if (isRedisAvailable()) {
                return redisTemplate.opsForValue().get(key);
            }
        } catch (Exception e) {
            log.warn("Redis read failure for key {}: {}. Falling back to in-memory cache.", key, e.getMessage());
        }
        return localCache.get(key);
    }

    public void evict(String key) {
        try {
            if (isRedisAvailable()) {
                redisTemplate.delete(key);
                return;
            }
        } catch (Exception e) {
            log.warn("Redis delete failure for key {}: {}.", key, e.getMessage());
        }
        localCache.remove(key);
    }

    /**
     * Record a hit (event timestamp) in a sliding window.
     */
    public void recordEvent(String windowKey, long timestampMs, long ttlMs) {
        try {
            if (isRedisAvailable()) {
                // Use Redis Sorted Set (ZSET)
                redisTemplate.opsForZSet().add(windowKey, String.valueOf(timestampMs), timestampMs);
                // Remove elements older than window threshold
                long cutOff = timestampMs - ttlMs;
                redisTemplate.opsForZSet().removeRangeByScore(windowKey, 0, cutOff);
                redisTemplate.expire(windowKey, ttlMs * 2, TimeUnit.MILLISECONDS);
                return;
            }
        } catch (Exception e) {
            log.warn("Redis sliding window write failure: {}. Falling back to in-memory.", e.getMessage());
        }

        // Fallback implementation
        localWindows.compute(windowKey, (k, list) -> {
            if (list == null) {
                list = new ArrayList<>();
            }
            list.add(timestampMs);
            long cutOff = timestampMs - ttlMs;
            list.removeIf(ts -> ts < cutOff);
            return list;
        });
    }

    /**
     * Get the count of events in a sliding window.
     */
    public long getEventCount(String windowKey, long durationMs) {
        long now = System.currentTimeMillis();
        long cutOff = now - durationMs;
        try {
            if (isRedisAvailable()) {
                // Remove elements older than threshold
                redisTemplate.opsForZSet().removeRangeByScore(windowKey, 0, cutOff);
                Long count = redisTemplate.opsForZSet().count(windowKey, cutOff, now);
                return count != null ? count : 0L;
            }
        } catch (Exception e) {
            log.warn("Redis sliding window read failure: {}. Falling back to in-memory.", e.getMessage());
        }

        // Fallback implementation
        List<Long> list = localWindows.get(windowKey);
        if (list == null) {
            return 0L;
        }
        synchronized (list) {
            list.removeIf(ts -> ts < cutOff);
            return list.stream().filter(ts -> ts >= cutOff).count();
        }
    }
}
