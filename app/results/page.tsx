'use client';

import { useState, useEffect } from 'react';
import { getSurveys, getResponsesBySurveyId, exportResponsesToCSV, exportSurveyToJSON } from '@/lib/storage';
import { downloadFile } from '@/lib/utils';
import { Survey, Response } from '@/types';

export default function ResultsPage() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);

    useEffect(() => {
        setSurveys(getSurveys());
    }, []);

    const handleSelectSurvey = (survey: Survey) => {
        setSelectedSurvey(survey);
        setResponses(getResponsesBySurveyId(survey.id));
    };

    const handleExportCSV = () => {
        if (!selectedSurvey) return;

        const csv = exportResponsesToCSV(selectedSurvey.id);
        downloadFile(csv, `${selectedSurvey.title}_responses.csv`, 'text/csv');
    };

    const handleExportJSON = () => {
        if (!selectedSurvey) return;

        const json = exportSurveyToJSON(selectedSurvey.id);
        downloadFile(json, `${selectedSurvey.title}_export.json`, 'application/json');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        アンケート結果
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        選択式の回答とAI対話の要約を確認できます
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Survey List */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                アンケート一覧
                            </h2>
                            {surveys.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    アンケートがありません
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {surveys.map((survey) => (
                                        <button
                                            key={survey.id}
                                            onClick={() => handleSelectSurvey(survey)}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedSurvey?.id === survey.id
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                                }`}
                                        >
                                            <div className="font-medium">{survey.title}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {getResponsesBySurveyId(survey.id).length} 件の回答
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Display */}
                    <div className="md:col-span-2">
                        {selectedSurvey ? (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {selectedSurvey.title}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        {selectedSurvey.description}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleExportCSV}
                                            disabled={responses.length === 0}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            📊 CSVエクスポート
                                        </button>
                                        <button
                                            onClick={handleExportJSON}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            💾 JSONエクスポート
                                        </button>
                                        <a
                                            href={`/survey/${selectedSurvey.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            🔗 アンケートを開く
                                        </a>
                                    </div>
                                </div>

                                {/* Responses */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                        回答一覧 ({responses.length}件)
                                    </h3>

                                    {responses.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400">
                                            まだ回答がありません
                                        </p>
                                    ) : (
                                        <div className="space-y-6">
                                            {responses.map((response, index) => (
                                                <div
                                                    key={response.id}
                                                    className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0"
                                                >
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                                            回答 #{index + 1}
                                                        </h4>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {new Date(response.submittedAt).toLocaleString('ja-JP')}
                                                        </span>
                                                    </div>

                                                    {/* 選択式の回答 */}
                                                    <div className="mb-4">
                                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            選択式の回答:
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {selectedSurvey.questions.map((question) => {
                                                                const answer = response.choiceAnswers.find(a => a.questionId === question.id);

                                                                return (
                                                                    <div key={question.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                            {question.questionText}
                                                                        </p>
                                                                        <p className="text-sm text-gray-900 dark:text-white mt-1">
                                                                            {answer ? (
                                                                                Array.isArray(answer.answer)
                                                                                    ? answer.answer.join(', ')
                                                                                    : answer.answer
                                                                            ) : '未回答'}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* AI対話の結果 */}
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                        <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                                                            🤖 AI深掘りインタビュー
                                                        </h5>

                                                        <div className="mb-3">
                                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                                                                テーマ:
                                                            </p>
                                                            <p className="text-sm text-blue-900 dark:text-blue-200">
                                                                {response.aiTheme}
                                                            </p>
                                                        </div>

                                                        <div className="mb-3">
                                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                                                                要約:
                                                            </p>
                                                            <p className="text-sm text-blue-900 dark:text-blue-200">
                                                                {response.aiSummary}
                                                            </p>
                                                        </div>

                                                        {response.aiKeywords && response.aiKeywords.length > 0 && (
                                                            <div>
                                                                <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
                                                                    キーワード:
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {response.aiKeywords.map((keyword, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                                                                        >
                                                                            {keyword}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400">
                                    左側からアンケートを選択してください
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
