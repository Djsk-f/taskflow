package com.taskflow.api.timeentry;

import com.taskflow.api.common.exception.ApiException;
import com.taskflow.api.common.exception.ErrorCode;
import com.taskflow.api.common.exception.ResourceNotFoundException;
import com.taskflow.api.task.Task;
import com.taskflow.api.task.TaskRepository;
import com.taskflow.api.timeentry.dto.TimeEntryRequest;
import com.taskflow.api.timeentry.dto.TimeEntryResponse;
import com.taskflow.api.user.UserRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Feuilles de temps. Une saisie ne peut viser qu'une tâche de l'utilisateur : la tâche
 * d'autrui est « introuvable » (404), exactement comme sur les routes de tâches (INV-08).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimeEntryService {

    /** Période maximale d'une lecture : de quoi couvrir un mois affiché avec ses bords. */
    static final int MAX_RANGE_DAYS = 62;

    private final TimeEntryRepository timeEntryRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public List<TimeEntryResponse> findBetween(Long userId, LocalDate from, LocalDate to) {
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "error.time.range", MAX_RANGE_DAYS);
        }
        return timeEntryRepository.findByUserIdAndWorkDateBetweenOrderByWorkDateAscIdAsc(userId, from, to)
                .stream().map(TimeEntryMapper::toResponse).toList();
    }

    public List<TimeEntryResponse> findForTask(Long taskId, Long userId) {
        requireOwnedTask(taskId, userId);
        return timeEntryRepository.findByTaskIdAndUserIdOrderByWorkDateDescIdDesc(taskId, userId)
                .stream().map(TimeEntryMapper::toResponse).toList();
    }

    @Transactional
    public TimeEntryResponse create(Long userId, TimeEntryRequest request) {
        TimeEntry entry = TimeEntry.builder()
                .user(userRepository.getReferenceById(userId))
                .task(requireOwnedTask(request.taskId(), userId))
                .build();
        TimeEntryMapper.applyTo(request, entry);
        TimeEntry saved = timeEntryRepository.saveAndFlush(entry);
        log.info("Temps saisi : id={} tâche={} utilisateur={}", saved.getId(), request.taskId(), userId);
        return TimeEntryMapper.toResponse(saved);
    }

    @Transactional
    public TimeEntryResponse update(Long entryId, Long userId, TimeEntryRequest request) {
        TimeEntry entry = timeEntryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.time.notFound"));
        if (!entry.getTask().getId().equals(request.taskId())) {
            entry.setTask(requireOwnedTask(request.taskId(), userId));
        }
        TimeEntryMapper.applyTo(request, entry);
        return TimeEntryMapper.toResponse(timeEntryRepository.saveAndFlush(entry));
    }

    @Transactional
    public void delete(Long entryId, Long userId) {
        if (timeEntryRepository.deleteByIdAndUserId(entryId, userId) == 0) {
            throw new ResourceNotFoundException("error.time.notFound");
        }
    }

    private Task requireOwnedTask(Long taskId, Long userId) {
        return taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.task.notFound"));
    }
}
