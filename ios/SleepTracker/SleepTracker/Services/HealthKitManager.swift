import Foundation
import HealthKit
import Combine

class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()
    
    let healthStore = HKHealthStore()
    
    private init() {}
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthError.healthDataNotAvailable
        }
        
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        let types: Set<HKSampleType> = [sleepType]
        
        try await healthStore.requestAuthorization(toShare: types, read: types)
    }
    
    func saveSleepSession(startTime: Date, endTime: Date, id: UUID) async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthError.healthDataNotAvailable
        }
        
        let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        
        // metadata
        let metadata: [String: Any] = [
            HKMetadataKeyExternalUUID: id.uuidString
        ]
        
        // check for existing samples with this UUID
        let predicate = HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeyExternalUUID, allowedValues: [id.uuidString])
        
        // HKSampleQueryDescriptor for ios 16+
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.sample(type: sleepType, predicate: predicate)],
            sortDescriptors: [],
            limit: nil
        )
        
        let existingSamples = try await descriptor.result(for: healthStore)
        
        if !existingSamples.isEmpty {
            try await healthStore.delete(existingSamples)
        }
        
        // create new sample
        let sample = HKCategorySample(
            type: sleepType,
            value: HKCategoryValueSleepAnalysis.inBed.rawValue,
            start: startTime,
            end: endTime,
            metadata: metadata
        )
        
        try await healthStore.save(sample)
    }
    
    func saveSessions(_ sessions: [SleepSession]) async throws {
        // filter for completed sessions only
        let completedSessions = sessions.filter { $0.endTime != nil }
        
        for session in completedSessions {
             // force unwrap safe because of filter
             try await saveSleepSession(
                startTime: session.startTime,
                endTime: session.endTime!,
                id: session.id
             )
        }
    }
}

enum HealthError: Error {
    case healthDataNotAvailable
}
