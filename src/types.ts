
export interface WordInfo {
  word: string;
  meaning: string;
  antonym: string;
  antonymMeaning: string;
}

export interface SentenceBreakdown {
  original: string;
  subject: string;
  verb: string;
  phrases: string[];
  translation: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface FillInTheBlank {
  sentence: string;
  answer: string;
}

export interface AnalysisResult {
  vocabulary: WordInfo[];
  sentences: SentenceBreakdown[];
  qa: QuestionAnswer[];
  matching: MatchingPair[];
  blanks: FillInTheBlank[];
}
