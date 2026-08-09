package com.delivery.foodDelivery.observability.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

@Component
public class CacheMetricsPostProcessor implements BeanPostProcessor {

    @Autowired
    private MeterRegistry meterRegistry;

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof CacheManager && !(bean instanceof MeteredCacheManager)) {
            return new MeteredCacheManager((CacheManager) bean, meterRegistry);
        }
        return bean;
    }
}
