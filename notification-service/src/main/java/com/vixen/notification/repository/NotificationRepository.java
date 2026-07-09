package com.vixen.notification.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.vixen.common.repository.BaseRepository;
import com.vixen.notification.model.Notification;

@Repository
public interface NotificationRepository extends BaseRepository<Notification> {
    List<Notification> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndReadFalseAndDeletedFalseOrderByCreatedAtDesc(String userId);
    List<Notification> findByUserIdAndReadTrueAndDeletedFalse(String userId);
    Optional<Notification> findByIdAndUserId(String id, String userId);
    List<Notification> findByStatusAndDeletedFalse(String status);
    List<Notification> findByTypeAndStatusAndDeletedFalse(String type, String status);
} 