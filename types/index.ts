export type QuestionType = 'radio' | 'checkbox';

export interface Question {
    id: string;
    surveyId: string;
    order: number;
    type: QuestionType;
    questionText: string;
    options: string[];
    required: boolean;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    questions: Question[];
}

export interface ConversationMessage {
    role: 'ai' | 'user';
    content: string;
    timestamp: string;
}

export interface ChoiceAnswer {
    questionId: string;
    answer: string | string[];
}

export interface Response {
    id: string;
    surveyId: string;
    submittedAt: string;
    sessionId: string;

    // 選択式の回答
    choiceAnswers: ChoiceAnswer[];

    // AIが決定したテーマ
    aiTheme: string;

    // AI対話の内容
    aiConversation: ConversationMessage[];

    // AI対話の要約
    aiSummary: string;
    aiKeywords: string[];
}
