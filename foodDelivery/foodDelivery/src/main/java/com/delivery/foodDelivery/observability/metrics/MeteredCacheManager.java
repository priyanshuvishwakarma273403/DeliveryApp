package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Collection;

public class MeteredCacheManager implements CacheManager {
    private final CacheManager delegate;
    private final MeterRegistry meterRegistry;

    public MeteredCacheManager(CacheManager delegate, MeterRegistry meterRegistry) {
        this.delegate = delegate;
        this.meterRegistry = meterRegistry;
    }

    @Override
    public Cache getCache(String name) {
        Cache cache = delegate.getCache(name);
        return cache != null ? new MeteredCache(cache, meterRegistry) : null;
    }

    @Override
    public Collection<String> getCacheNames() {
        return delegate.getCacheNames();
    }
}
