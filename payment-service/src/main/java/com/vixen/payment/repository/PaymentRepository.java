package com.vixen.payment.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.vixen.common.repository.BaseRepository;
import com.vixen.payment.model.Payment;

@Repository
public interface PaymentRepository extends BaseRepository<Payment> {
    Optional<Payment> findByOrderId(String orderId);
    Optional<Payment> findByPaymentIntentId(String paymentIntentId);
} 