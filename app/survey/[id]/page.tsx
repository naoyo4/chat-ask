'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Question, ChoiceAnswer, ConversationMessage, Response } from '@/types';
import { generateId, generateSessionId } from '@/lib/utils';
import { getSurveyById, saveResponse } from '@/lib/storage';

type Step = 'choice' | 'analyzing' | 'interview' | 'complete';

export default function SurveyPage() {
    const params = useParams();
    const router = useRouter();
    const surveyId = params.id as string;

    const [survey, setSurvey] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<Step>('choice');

    // 選択式の回答
    const [choiceAnswers, setChoiceAnswers] = useState<Record<string, string | string[]>>({});

    // AI分析結果
    const [aiTheme, setAiTheme] = useState('');
    const [initialQuestion, setInitialQuestion] = useState('');

    // AI対話
    const [conversation, setConversation] = useState<ConversationMessage[]>([]);
    const [aiSummary, setAiSummary] = useState('');
    const [aiKeywords, setAiKeywords] = useState<string[]>([]);

    const [sessionId] = useState(generateSessionId());

    useEffect(() => {
        const loadedSurvey = getSurveyById(surveyId);
        if (loadedSurvey) {
            setSurvey(loadedSurvey);
        }
        setLoading(false);
    }, [surveyId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
            </div>
        );
    }

    if (!survey) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                        アンケートが見つかりません
                    </p>
                    <a href="/" className="text-blue-600 hover:underline">
                        トップページに戻る
                    </a>
                </div>
            </div>
        );
    }

    const handleChoiceSubmit = async () => {
        // 選択式回答を配列に変換
        const answers: ChoiceAnswer[] = survey.questions.map((q: Question) => ({
            questionId: q.id,
            answer: choiceAnswers[q.id] || ''
        }));

        setStep('analyzing');

        try {
            // AIに回答を分析させる
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: survey.questions,
                    choiceAnswers: answers
                })
            });

            const { theme, initialQuestion: firstQuestion } = await response.json();

            setAiTheme(theme);
            setInitialQuestion(firstQuestion);

            // AI対話を開始
            const firstMessage: ConversationMessage = {
                role: 'ai',
                content: firstQuestion,
                timestamp: new Date().toISOString()
            };
            setConversation([firstMessage]);
            setStep('interview');
        } catch (error) {
            console.error('Analysis error:', error);
            alert('エラーが発生しました。もう一度お試しください。');
            setStep('choice');
        }
    };

    const handleInterviewComplete = (summary: string, keywords: string[]) => {
        setAiSummary(summary);
        setAiKeywords(keywords);

        // 回答を保存
        const choiceAnswersArray: ChoiceAnswer[] = survey.questions.map((q: Question) => ({
            questionId: q.id,
            answer: choiceAnswers[q.id] || ''
        }));

        const response: Response = {
            id: generateId(),
            surveyId: survey.id,
            submittedAt: new Date().toISOString(),
            sessionId,
            choiceAnswers: choiceAnswersArray,
            aiTheme,
            aiConversation: conversation,
            aiSummary: summary,
            aiKeywords: keywords
        };

        saveResponse(response);
        setStep('complete');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
            <div className="container mx-auto px-4 max-w-3xl">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {survey.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {survey.description}
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="mb-6">
                    <div className="flex items-center justify-center gap-4">
                        <StepIndicator
                            number={1}
                            label="選択式回答"
                            active={step === 'choice'}
                            completed={step !== 'choice'}
                        />
                        <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600" />
                        <StepIndicator
                            number={2}
                            label="AI分析"
                            active={step === 'analyzing'}
                            completed={step === 'interview' || step === 'complete'}
                        />
                        <div className="h-0.5 w-12 bg-gray-300 dark:bg-gray-600" />
                        <StepIndicator
                            number={3}
                            label="AI対話"
                            active={step === 'interview'}
                            completed={step === 'complete'}
                        />
                    </div>
                </div>

                {/* Content */}
                {step === 'choice' && (
                    <ChoiceQuestionsStep
                        questions={survey.questions}
                        answers={choiceAnswers}
                        onAnswerChange={setChoiceAnswers}
                        onSubmit={handleChoiceSubmit}
                    />
                )}

                {step === 'analyzing' && (
                    <AnalyzingStep />
                )}

                {step === 'interview' && (
                    <InterviewStep
                        theme={aiTheme}
                        conversation={conversation}
                        onConversationUpdate={setConversation}
                        onComplete={handleInterviewComplete}
                    />
                )}

                {step === 'complete' && (
                    <CompleteStep />
                )}
            </div>
        </div>
    );
}

// ステップインジケーター
function StepIndicator({ number, label, active, completed }: {
    number: number;
    label: string;
    active: boolean;
    completed: boolean;
}) {
    return (
        <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${completed
                    ? 'bg-green-600 text-white'
                    : active
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                {completed ? '✓' : number}
            </div>
            <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">{label}</span>
        </div>
    );
}

// ステップ1: 選択式質問
function ChoiceQuestionsStep({
    questions,
    answers,
    onAnswerChange,
    onSubmit
}: {
    questions: Question[];
    answers: Record<string, string | string[]>;
    onAnswerChange: (answers: Record<string, string | string[]>) => void;
    onSubmit: () => void;
}) {
    const handleAnswer = (questionId: string, answer: string | string[]) => {
        onAnswerChange({ ...answers, [questionId]: answer });
    };

    const allAnswered = questions.every(q => answers[q.id]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                以下の質問にお答えください
            </h2>

            <div className="space-y-6">
                {questions.map((question, index) => (
                    <div key={question.id} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <p className="font-medium text-gray-900 dark:text-white mb-3">
                            Q{index + 1}. {question.questionText}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                        </p>

                        {question.type === 'radio' && (
                            <div className="space-y-2">
                                {question.options.map((option, i) => (
                                    <label
                                        key={i}
                                        className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name={question.id}
                                            value={option}
                                            checked={answers[question.id] === option}
                                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-gray-900 dark:text-white">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {question.type === 'checkbox' && (
                            <div className="space-y-2">
                                {question.options.map((option, i) => {
                                    const selected = (answers[question.id] as string[]) || [];
                                    return (
                                        <label
                                            key={i}
                                            className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(option)}
                                                onChange={(e) => {
                                                    const newSelected = e.target.checked
                                                        ? [...selected, option]
                                                        : selected.filter(o => o !== option);
                                                    handleAnswer(question.id, newSelected);
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-gray-900 dark:text-white">{option}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={onSubmit}
                    disabled={!allAnswered}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    回答を送信
                </button>
            </div>
        </div>
    );
}

// ステップ2: AI分析中
function AnalyzingStep() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                回答を分析しています...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
                AIがあなたの回答を分析し、適切な深掘りテーマを決定しています
            </p>
        </div>
    );
}

// ステップ3: AI対話インタビュー
function InterviewStep({
    theme,
    conversation,
    onConversationUpdate,
    onComplete
}: {
    theme: string;
    conversation: ConversationMessage[];
    onConversationUpdate: (conv: ConversationMessage[]) => void;
    onComplete: (summary: string, keywords: string[]) => void;
}) {
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!userInput.trim()) return;

        const userMessage: ConversationMessage = {
            role: 'user',
            content: userInput,
            timestamp: new Date().toISOString()
        };

        const newConversation = [...conversation, userMessage];
        onConversationUpdate(newConversation);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationHistory: newConversation,
                    theme,
                    maxTurns: 5
                })
            });

            const data = await response.json();

            if (data.isComplete) {
                onComplete(data.summary, data.keywords);
            } else {
                const aiMessage: ConversationMessage = {
                    role: 'ai',
                    content: data.nextQuestion,
                    timestamp: new Date().toISOString()
                };
                onConversationUpdate([...newConversation, aiMessage]);
            }
        } catch (error) {
            console.error('Interview error:', error);
            alert('エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const currentTurn = Math.floor(conversation.length / 2) + 1;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>深掘りテーマ:</strong> {theme}
                    </p>
                </div>
            </div>

            {/* Conversation */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                    {conversation.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-lg ${message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <p className="text-sm">{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500">入力中...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="回答を入力..."
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !userInput.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    送信
                </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                対話ターン: {currentTurn} / 5
            </p>
        </div>
    );
}

// ステップ4: 完了
function CompleteStep() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                回答が完了しました！
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                ご協力ありがとうございました
            </p>
            <a
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                トップページに戻る
            </a>
        </div>
    );
}
