package com.vixen.order.repository;

import com.vixen.order.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByUserId(String userId);
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByOrderStatus(String orderStatus);
} 