package com.delivery.foodDelivery.controller;

import com.delivery.foodDelivery.dto.response.ApiResponse;
import com.delivery.foodDelivery.entity.BlacklistItem;
import com.delivery.foodDelivery.entity.FraudCase;
import com.delivery.foodDelivery.service.FraudDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fraud")
@RequiredArgsConstructor
public class FraudController {

    private final FraudDetectionService fraudService;

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse<FraudDetectionService.FraudCheckResult>> evaluateEvent(
            @RequestParam(required = false) String entityId,
            @RequestParam String entityType,
            @RequestParam String eventType,
            @RequestBody Map<String, Object> context) {
        
        FraudDetectionService.FraudCheckResult result = 
                fraudService.evaluateEvent(entityId, entityType, eventType, context);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/cases")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FraudCase>>> getCases() {
        return ResponseEntity.ok(ApiResponse.success(fraudService.getCases()));
    }

    @GetMapping("/cases/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCase>> getCaseById(@PathVariable String id) {
        return fraudService.getCase(id)
                .map(f -> ResponseEntity.ok(ApiResponse.success(f)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/cases/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCase>> assignInvestigator(
            @PathVariable String id,
            @RequestParam String investigator) {
        FraudCase updated = fraudService.assignInvestigator(id, investigator);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PostMapping("/cases/{id}/note")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCase>> addNote(
            @PathVariable String id,
            @RequestParam String note) {
        FraudCase updated = fraudService.addNote(id, note);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PatchMapping("/cases/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FraudCase>> closeCase(
            @PathVariable String id,
            @RequestParam String resolution) {
        FraudCase updated = fraudService.closeCase(id, resolution);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @GetMapping("/blacklist")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BlacklistItem>>> getBlacklist() {
        return ResponseEntity.ok(ApiResponse.success(fraudService.getBlacklist()));
    }

    @PostMapping("/blacklist")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BlacklistItem>> addToBlacklist(@RequestBody BlacklistItem item) {
        BlacklistItem created = fraudService.addToBlacklist(item);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @DeleteMapping("/blacklist/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> removeFromBlacklist(@PathVariable String id) {
        fraudService.removeFromBlacklist(id);
        return ResponseEntity.ok(ApiResponse.success("Entry removed from blacklist"));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(fraudService.getFraudAnalytics()));
    }
}
