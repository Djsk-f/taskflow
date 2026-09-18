package com.taskflow.api.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Tâches planifiées (génération des notifications), coupées par `app.notifications.enabled=false`. */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.notifications.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulingConfig {
}
