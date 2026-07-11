package com.vixen.product.repository;

import com.vixen.common.repository.BaseRepository;
import com.vixen.product.model.Category;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends BaseRepository<Category> {
    List<Category> findByParentId(String parentId);
    Optional<Category> findBySlug(String slug);
    List<Category> findByLevel(int level);
    List<Category> findByActive(boolean active);
}
