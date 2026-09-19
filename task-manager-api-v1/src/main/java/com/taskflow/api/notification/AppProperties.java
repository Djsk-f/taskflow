package com.taskflow.api.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Réglages applicatifs partagés (`app.*`) : ici l'adresse publique mise dans les e-mails. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(@DefaultValue("http://localhost:3000") String publicUrl) {
}
