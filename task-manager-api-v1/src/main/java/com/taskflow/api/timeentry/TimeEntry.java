package com.taskflow.api.timeentry;

import com.taskflow.api.common.model.Auditable;
import com.taskflow.api.task.Task;
import com.taskflow.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** Temps passé sur une tâche, un jour donné (feuille de temps). */
@Getter
@Setter
@Builder
@Entity
@Table(name = "time_entries")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class TimeEntry extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    /** Supprimer une tâche supprime ses saisies (ON DELETE CASCADE, comme la migration V2). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Task task;

    /** Jour travaillé, sans fuseau : une feuille de temps compte des journées, pas des instants. */
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(length = 500)
    private String note;
}
