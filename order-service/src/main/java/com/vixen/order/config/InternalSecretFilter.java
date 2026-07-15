package com.vixen.order.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@Order(1)
public class InternalSecretFilter extends OncePerRequestFilter {

    private final String internalServiceSecret;
    private final ObjectMapper objectMapper;

    public InternalSecretFilter(
            @Value("${internal.service-secret}") String internalServiceSecret,
            ObjectMapper objectMapper) {
        this.internalServiceSecret = internalServiceSecret;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String incomingSecret = request.getHeader("X-Internal-Secret");

        if (incomingSecret == null || !incomingSecret.equals(internalServiceSecret)) {
            log.warn("Rejected request from {}: invalid or missing X-Internal-Secret header",
                    request.getRemoteAddr());

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            Map<String, Object> errorBody = Map.of(
                    "status", 403,
                    "error", "Forbidden",
                    "message", "Invalid or missing internal service secret"
            );

            objectMapper.writeValue(response.getWriter(), errorBody);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
