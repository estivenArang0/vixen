package com.vixen.order.client;

import com.vixen.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name = "notification-service", url = "${services.notification.url}")
public interface NotificationServiceClient {
    @PostMapping("/api/v1/notifications")
    ApiResponse<?> createNotification(@RequestBody Map<String, Object> notification);
}
