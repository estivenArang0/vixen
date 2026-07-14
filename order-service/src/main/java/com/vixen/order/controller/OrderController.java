package com.vixen.order.controller;

import com.vixen.common.exception.UnauthorizedException;
import com.vixen.order.dto.OrderDTO;
import com.vixen.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Controller", description = "APIs for managing orders")
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Create a new order")
    public ResponseEntity<OrderDTO> createOrder(
            @Valid @RequestBody OrderDTO orderDTO,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (!isAdmin(userRoles) && !orderDTO.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("No puedes crear un pedido a nombre de otro usuario");
        }
        return new ResponseEntity<>(orderService.createOrder(orderDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID")
    public ResponseEntity<OrderDTO> getOrderById(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        OrderDTO order = orderService.getOrderById(id);
        requireOwnerOrAdmin(order.getUserId(), currentUserId, userRoles);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/number/{orderNumber}")
    @Operation(summary = "Get order by order number")
    public ResponseEntity<OrderDTO> getOrderByOrderNumber(
            @PathVariable String orderNumber,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        OrderDTO order = orderService.getOrderByOrderNumber(orderNumber);
        requireOwnerOrAdmin(order.getUserId(), currentUserId, userRoles);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get orders by user ID")
    public ResponseEntity<List<OrderDTO>> getOrdersByUserId(
            @PathVariable String userId,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        requireOwnerOrAdmin(userId, currentUserId, userRoles);
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @GetMapping("/status/{orderStatus}")
    @Operation(summary = "Get orders by status")
    public ResponseEntity<List<OrderDTO>> getOrdersByStatus(
            @PathVariable String orderStatus,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (!isAdmin(userRoles)) {
            throw new UnauthorizedException("Solo administradores pueden ver pedidos por estado");
        }
        return ResponseEntity.ok(orderService.getOrdersByStatus(orderStatus));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update order status")
    public ResponseEntity<OrderDTO> updateOrderStatus(
            @PathVariable String id,
            @RequestParam String orderStatus,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (!isAdmin(userRoles)) {
            throw new UnauthorizedException("Solo administradores pueden cambiar el estado de un pedido");
        }
        return ResponseEntity.ok(orderService.updateOrderStatus(id, orderStatus));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update order")
    public ResponseEntity<OrderDTO> updateOrder(
            @PathVariable String id,
            @Valid @RequestBody OrderDTO orderDTO,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        OrderDTO order = orderService.getOrderById(id);
        requireOwnerOrAdmin(order.getUserId(), currentUserId, userRoles);
        return ResponseEntity.ok(orderService.updateOrder(id, orderDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete order")
    public ResponseEntity<Void> deleteOrder(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles) {
        if (!isAdmin(userRoles)) {
            throw new UnauthorizedException("Solo administradores pueden eliminar pedidos");
        }
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────
    // Security helpers
    // ─────────────────────────────────────────────────────

    private boolean isAdmin(String userRoles) {
        return userRoles != null && userRoles.contains("ROLE_ADMIN");
    }

    private void requireOwnerOrAdmin(String resourceUserId, String currentUserId, String userRoles) {
        if (isAdmin(userRoles)) return;
        if (currentUserId == null || !currentUserId.equals(resourceUserId)) {
            throw new UnauthorizedException("No autorizado: no eres el dueño de este recurso");
        }
    }
}
