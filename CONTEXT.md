# Neuropathic Pain Clinical Decision Support (FamMed CDSS)

A clinical decision support and consultation tracking system for family medicine and primary care clinicians evaluating and managing neuropathic pain based on TASP 2020 guidelines.

## Language

### Clinical Entities & Evaluation

**Patient Case**:
A de-identified clinical profile representing a patient undergoing evaluation and treatment for chronic pain.
_Avoid_: Medical record, patient file, chart

**Consultation**:
A single clinical encounter where pain assessment is performed, clinical recommendations are generated, and management decisions are recorded.
_Avoid_: Visit, appointment, session

**Pain Phenotype**:
The dominant sensory characteristic of neuropathic pain (burning, lancinating, allodynia, paresthesia, or mixed) reflecting its underlying neurobiological mechanism.
_Avoid_: Pain type, symptom description

**Etiology**:
The underlying medical condition causing neuropathic damage (such as DPN, PHN, TGN, Central Pain, Phantom Limb, Fibromyalgia, or Myofascial Pain).
_Avoid_: Diagnosis, primary disease, cause

**Comorbidity**:
A co-existing health condition or physiological state that modifies drug safety, requiring dose adjustment, heightened caution, or absolute contraindication.
_Avoid_: Past history, medical condition

### Pharmacotherapy & Decision Support

**Formulary Drug**:
A neuropathic pain medication recognized by the system and configured for availability within a specific clinic or hospital setting.
_Avoid_: Medicine, pharmaceutical, inventory item

**Clinic Formulary**:
The subset of recognized neuropathic pain medications stocked and dispensable by a particular healthcare facility.
_Avoid_: Inventory, drug stock, medicine list

**Recommendation Score**:
A composite numerical score ranking a drug's appropriateness for a specific consultation by combining phenotype match, etiology guidance, first-line status, and comorbidity penalties.
_Avoid_: Drug rank, algorithm score, points

**Drug-Drug Interaction**:
A clinically significant pharmacodynamic or pharmacokinetic clash between two co-prescribed agents categorized by severity and management guidelines.
_Avoid_: DDI, drug clash, contraindication

**Physician Decision**:
The final medication, dosage, and rationale selected by the attending clinician, which may confirm or override the system's recommendation.
_Avoid_: Prescription, doctor order, selection

**Clinical Rationale**:
The documented medical reasoning provided by a clinician when choosing or titrating a drug, particularly when departing from the system's top recommendation or accepting a cautionary alert.
_Avoid_: Doctor comment, note, excuse

### Longitudinal Care & Documentation

**Pain Score**:
A standardized numerical rating (NRS/VAS 0–10) capturing pain intensity reported during a consultation.
_Avoid_: Pain level, pain meter

**Longitudinal Timeline**:
The chronological sequence of consultations for a Patient Case demonstrating treatment response, pain score trajectory, and dose titration over time.
_Avoid_: History log, progress track

**SOAP Note**:
A structured clinical summary formatted into Subjective, Objective, Assessment, and Plan sections ready for direct transfer into hospital information systems.
_Avoid_: Summary text, report, discharge note

### Authentication & Session Management

**Clinician Session**:
An active authenticated state identifying the attending clinician responsible for consultations conducted on the current workstation.
_Avoid_: Login token, auth cookie, user state


