package com.delivery.foodDelivery.service;

import com.delivery.foodDelivery.entity.UserTasteProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class TasteDnaCacheService {

    private final CacheManager cacheManager;

    public UserTasteProfile getProfile(String userId) {
        try {
            Cache cache = cacheManager.getCache("user-taste");
            if (cache != null) {
                Cache.ValueWrapper wrapper = cache.get(userId);
                if (wrapper != null) {
                    return (UserTasteProfile) wrapper.get();
                }
            }
        } catch (Exception e) {
            log.error("Redis cache read failure for user {}: {}", userId, e.getMessage());
        }
        return null;
    }

    public void putProfile(String userId, UserTasteProfile profile) {
        try {
            Cache cache = cacheManager.getCache("user-taste");
            if (cache != null) {
                cache.put(userId, profile);
            }
        } catch (Exception e) {
            log.error("Redis cache write failure for user {}: {}", userId, e.getMessage());
        }
    }

    public void evictProfile(String userId) {
        try {
            Cache cache = cacheManager.getCache("user-taste");
            if (cache != null) {
                cache.evict(userId);
            }
        } catch (Exception e) {
            log.error("Redis cache evict failure for user {}: {}", userId, e.getMessage());
        }
    }
}
