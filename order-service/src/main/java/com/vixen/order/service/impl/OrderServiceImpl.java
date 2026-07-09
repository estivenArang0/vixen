package com.vixen.order.service.impl;

import com.vixen.order.client.NotificationServiceClient;
import com.vixen.order.client.ProductServiceClient;
import com.vixen.order.dto.OrderDTO;
import com.vixen.order.exception.OrderNotFoundException;
import com.vixen.order.mapper.OrderMapper;
import com.vixen.order.model.Order;
import com.vixen.order.repository.OrderRepository;
import com.vixen.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final ProductServiceClient productServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Override
    @Transactional
    public OrderDTO createOrder(OrderDTO orderDTO) {
        Order order = orderMapper.toOrder(orderDTO);
        order.setOrderNumber(generateOrderNumber());
        order.setOrderDate(LocalDateTime.now());
        order.setOrderStatus("PENDING");
        order.setPaymentStatus("PENDING");
        OrderDTO savedOrder = orderMapper.toOrderDTO(orderRepository.save(order));

        // Notificación al usuario: pedido recibido
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", savedOrder.getUserId());
            notification.put("title", "Pedido recibido");
            notification.put("content", "Tu pedido " + savedOrder.getOrderNumber() + " ha sido recibido y está pendiente de aprobación.");
            notification.put("type", "IN_APP");
            notification.put("category", "ORDER");
            notificationServiceClient.createNotification(notification);
        } catch (Exception e) {
            log.warn("Error al enviar notificación de pedido creado {}: {}", savedOrder.getOrderNumber(), e.getMessage());
        }

        return savedOrder;
    }

    @Override
    public OrderDTO getOrderById(String id) {
        return orderRepository.findById(id)
                .map(orderMapper::toOrderDTO)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + id));
    }

    @Override
    public OrderDTO getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .map(orderMapper::toOrderDTO)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with order number: " + orderNumber));
    }

    @Override
    public List<OrderDTO> getOrdersByUserId(String userId) {
        return orderMapper.toOrderDTOList(orderRepository.findByUserId(userId));
    }

    @Override
    public List<OrderDTO> getOrdersByStatus(String orderStatus) {
        return orderMapper.toOrderDTOList(orderRepository.findByOrderStatus(orderStatus));
    }

    @Override
    @Transactional
    public OrderDTO updateOrderStatus(String id, String orderStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + id));

        String previousStatus = order.getOrderStatus();
        order.setOrderStatus(orderStatus);
        OrderDTO updatedOrder = orderMapper.toOrderDTO(orderRepository.save(order));

        // Notificación al usuario solo si el estado realmente cambió
        if (!orderStatus.equalsIgnoreCase(previousStatus)) {
            try {
                Map<String, Object> notification = buildStatusNotification(updatedOrder, orderStatus);
                if (notification != null) {
                    notificationServiceClient.createNotification(notification);
                }
            } catch (Exception e) {
                log.warn("Error al enviar notificación de cambio de estado para pedido {}: {}", updatedOrder.getOrderNumber(), e.getMessage());
            }
        }

        return updatedOrder;
    }

    @Override
    @Transactional
    public OrderDTO updateOrder(String id, OrderDTO orderDTO) {
        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + id));
        Order updatedOrder = orderMapper.toOrder(orderDTO);
        updatedOrder.setId(id);
        return orderMapper.toOrderDTO(orderRepository.save(updatedOrder));
    }

    @Override
    @Transactional
    public void deleteOrder(String id) {
        if (!orderRepository.existsById(id)) {
            throw new OrderNotFoundException("Order not found with id: " + id);
        }
        orderRepository.deleteById(id);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private String generateOrderNumber() {
        return "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /**
     * Construye la notificación adecuada según el nuevo estado del pedido.
     * Retorna null si el estado no requiere notificación.
     */
    private Map<String, Object> buildStatusNotification(OrderDTO order, String newStatus) {
        String title;
        String content;

        switch (newStatus.toUpperCase()) {
            case "PROCESSING":
                title = "Auren aprobó tu pedido";
                content = "Tu pedido " + order.getOrderNumber() + " ha sido aprobado y está siendo preparado.";
                break;
            case "SHIPPED":
                title = "Tu pedido está en camino";
                content = "Tu pedido " + order.getOrderNumber() + " ha sido enviado y pronto llegará a tu dirección.";
                break;
            case "DELIVERED":
                title = "Pedido entregado";
                content = "Tu pedido " + order.getOrderNumber() + " fue entregado. ¡Gracias por tu compra en Auren!";
                break;
            case "CANCELLED":
                title = "Pedido cancelado";
                content = "Tu pedido " + order.getOrderNumber() + " fue cancelado. Si tienes dudas, contáctanos.";
                break;
            default:
                // Estados como PENDING u otros no generan notificación adicional
                return null;
        }

        Map<String, Object> notification = new HashMap<>();
        notification.put("userId", order.getUserId());
        notification.put("title", title);
        notification.put("content", content);
        notification.put("type", "IN_APP");
        notification.put("category", "ORDER");
        notification.put("priority", "HIGH");
        notification.put("sourceId", order.getId());
        notification.put("source", "order-service");
        notification.put("actionUrl", "/account/orders/" + order.getId());
        return notification;
    }
}