'use client';

import { useState } from 'react';
import { Question, QuestionType, Survey } from '@/types';
import { generateId } from '@/lib/utils';
import { saveSurvey as saveSurveyToStorage } from '@/lib/storage';

export default function CreateSurveyPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);

    const addQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            id: generateId(),
            surveyId: '',
            order: questions.length,
            type,
            questionText: '',
            options: [''],
            required: false
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const deleteQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newQuestions.length) return;

        [newQuestions[index], newQuestions[targetIndex]] =
            [newQuestions[targetIndex], newQuestions[index]];

        newQuestions.forEach((q, i) => q.order = i);
        setQuestions(newQuestions);
    };

    const saveSurvey = async () => {
        if (!title || questions.length === 0) {
            alert('タイトルと少なくとも1つの質問を入力してください');
            return;
        }

        const survey: Survey = {
            id: generateId(),
            title,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            questions: questions.map((q, index) => ({
                ...q,
                surveyId: '',
                order: index
            }))
        };

        // Update surveyId for all questions
        survey.questions.forEach(q => q.surveyId = survey.id);

        saveSurveyToStorage(survey);

        alert('アンケートを保存しました！');

        // Navigate to survey page
        window.location.href = `/survey/${survey.id}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        アンケート作成
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        選択式質問を作成してください。回答後、AIが自動的に深掘りインタビューを行います。
                    </p>
                </div>

                {/* Survey Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            タイトル
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="アンケートのタイトル"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            説明
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="アンケートの説明"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-4 mb-6">
                    {questions.map((question, index) => (
                        <QuestionEditor
                            key={question.id}
                            question={question}
                            index={index}
                            totalQuestions={questions.length}
                            onUpdate={(updates) => updateQuestion(question.id, updates)}
                            onDelete={() => deleteQuestion(question.id)}
                            onMove={(direction) => moveQuestion(index, direction)}
                        />
                    ))}
                </div>

                {/* Add Question Buttons */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        質問を追加（選択式のみ）
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => addQuestion('radio')}
                            className="px-4 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                            📻 ラジオボタン（単一選択）
                        </button>
                        <button
                            onClick={() => addQuestion('checkbox')}
                            className="px-4 py-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                            ☑️ チェックボックス（複数選択）
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        💡 回答後、AIが自動的に回答内容を分析し、適切なテーマで深掘りインタビューを行います
                    </p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={saveSurvey}
                        disabled={!title || questions.length === 0}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}

interface QuestionEditorProps {
    question: Question;
    index: number;
    totalQuestions: number;
    onUpdate: (updates: Partial<Question>) => void;
    onDelete: () => void;
    onMove: (direction: 'up' | 'down') => void;
}

function QuestionEditor({ question, index, totalQuestions, onUpdate, onDelete, onMove }: QuestionEditorProps) {
    const addOption = () => {
        const newOptions = [...question.options, ''];
        onUpdate({ options: newOptions });
    };

    const updateOption = (optionIndex: number, value: string) => {
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        onUpdate({ options: newOptions });
    };

    const deleteOption = (optionIndex: number) => {
        const newOptions = question.options.filter((_, i) => i !== optionIndex);
        onUpdate({ options: newOptions });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        Q{index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {question.type === 'radio' && 'ラジオボタン'}
                        {question.type === 'checkbox' && 'チェックボックス'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onMove('up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => onMove('down')}
                        disabled={index === totalQuestions - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
                    >
                        ↓
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    質問文
                </label>
                <input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => onUpdate({ questionText: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="質問を入力"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    選択肢
                </label>
                <div className="space-y-2">
                    {question.options.map((option, i) => (
                        <div key={i} className="flex gap-2">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(i, e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder={`選択肢 ${i + 1}`}
                            />
                            <button
                                onClick={() => deleteOption(i)}
                                className="px-3 py-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    onClick={addOption}
                    className="mt-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    + 選択肢を追加
                </button>
            </div>

            <div className="mt-4">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => onUpdate({ required: e.target.checked })}
                        className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">必須回答</span>
                </label>
            </div>
        </div>
    );
}
