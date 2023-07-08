package com.hoangdaongu.server.repo;

import com.hoangdaongu.server.model.Server;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServerRepo extends JpaRepository<Server, Long> {
    Server findByIpAddress(String ipAddress);
}
