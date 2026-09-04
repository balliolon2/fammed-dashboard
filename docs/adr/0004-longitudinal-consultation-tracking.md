# 0004: Longitudinal Consultation Tracking

To support continuous family medicine care and guideline-directed drug titration ("Start Low, Go Slow"), the data model separates Patient Case from Consultation in a 1:N relationship. A Patient Case holds baseline demographic and physiological traits, while each Consultation captures a discrete visit with its Pain Score (NRS 0–10), assessment, CDSS recommendation, physician prescription decision, and titration notes, enabling chronological pain trajectory analysis.
