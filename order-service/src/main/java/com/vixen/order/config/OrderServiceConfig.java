package com.vixen.order.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@ComponentScan(basePackages = "com.vixen.order")
@EnableMongoRepositories(basePackages = "com.vixen.order.repository")
public class OrderServiceConfig {
} 