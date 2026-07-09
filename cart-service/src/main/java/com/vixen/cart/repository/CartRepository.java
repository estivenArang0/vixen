package com.vixen.cart.repository;

import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.vixen.cart.model.Cart;
import com.vixen.common.repository.BaseRepository;

@Repository
public interface CartRepository extends BaseRepository<Cart> {
    Optional<Cart> findByUserId(String userId);
    void deleteByUserId(String userId);
} 