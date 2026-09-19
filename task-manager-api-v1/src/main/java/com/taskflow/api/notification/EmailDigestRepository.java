package com.taskflow.api.notification;

import com.taskflow.api.user.User;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmailDigestRepository extends JpaRepository<EmailDigest, Long> {

    boolean existsByUserIdAndDigestDate(Long userId, LocalDate digestDate);

    /** Utilisateurs ayant demandé le récapitulatif et pas encore servis ce jour-là. */
    @Query("select u from User u where u.notificationPreferences.emailDigest = true and not exists "
            + "(select d.id from EmailDigest d where d.user = u and d.digestDate = :day)")
    List<User> findUsersToSendOn(@Param("day") LocalDate day);
}
