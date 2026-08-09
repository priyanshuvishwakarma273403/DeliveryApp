package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.cache.Cache;

import java.util.concurrent.Callable;

public class MeteredCache implements Cache {
    private final Cache delegate;
    private final Counter hitCounter;
    private final Counter missCounter;

    public MeteredCache(Cache delegate, MeterRegistry registry) {
        this.delegate = delegate;
        this.hitCounter = Counter.builder("ecommerce_cache_hits_total")
                .tag("cache", delegate.getName())
                .description("Total cache hits")
                .register(registry);
        this.missCounter = Counter.builder("ecommerce_cache_misses_total")
                .tag("cache", delegate.getName())
                .description("Total cache misses")
                .register(registry);
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    @Override
    public Object getNativeCache() {
        return delegate.getNativeCache();
    }

    @Override
    public ValueWrapper get(Object key) {
        ValueWrapper wrapper = delegate.get(key);
        if (wrapper != null) {
            hitCounter.increment();
        } else {
            missCounter.increment();
        }
        return wrapper;
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
        T value = delegate.get(key, type);
        if (value != null) {
            hitCounter.increment();
        } else {
            missCounter.increment();
        }
        return value;
    }

    @SuppressWarnings("unchecked")
    @Override
    public <T> T get(Object key, Callable<T> valueLoader) {
        ValueWrapper wrapper = delegate.get(key);
        if (wrapper != null) {
            hitCounter.increment();
            return (T) wrapper.get();
        } else {
            missCounter.increment();
            return delegate.get(key, valueLoader);
        }
    }

    @Override
    public void put(Object key, Object value) {
        delegate.put(key, value);
    }

    @Override
    public void evict(Object key) {
        delegate.evict(key);
    }

    @Override
    public void clear() {
        delegate.clear();
    }
}
