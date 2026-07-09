package com.vixen.shipping.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.vixen.common.repository.BaseRepository;
import com.vixen.shipping.model.Shipment;

@Repository
public interface ShipmentRepository extends BaseRepository<Shipment> {
    Optional<Shipment> findByOrderId(String orderId);
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
} 