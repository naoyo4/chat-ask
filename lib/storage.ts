import { Survey, Response } from '@/types';

// LocalStorage keys
const SURVEYS_KEY = 'chatask_surveys';
const RESPONSES_KEY = 'chatask_responses';

// Survey management
export function saveSurvey(survey: Survey): void {
    const surveys = getSurveys();
    const existingIndex = surveys.findIndex(s => s.id === survey.id);

    if (existingIndex >= 0) {
        surveys[existingIndex] = survey;
    } else {
        surveys.push(survey);
    }

    localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));
}

export function getSurveys(): Survey[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(SURVEYS_KEY);
    return data ? JSON.parse(data) : [];
}

export function getSurveyById(id: string): Survey | null {
    const surveys = getSurveys();
    return surveys.find(s => s.id === id) || null;
}

export function deleteSurvey(id: string): void {
    const surveys = getSurveys().filter(s => s.id !== id);
    localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));

    // Also delete associated responses
    const responses = getResponses().filter(r => r.surveyId !== id);
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
}

// Response management
export function saveResponse(response: Response): void {
    const responses = getResponses();
    responses.push(response);
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
}

export function getResponses(): Response[] {
    if (typeof window === 'undefined') return [];

    const data = localStorage.getItem(RESPONSES_KEY);
    return data ? JSON.parse(data) : [];
}

export function getResponsesBySurveyId(surveyId: string): Response[] {
    return getResponses().filter(r => r.surveyId === surveyId);
}

// Export to JSON
export function exportSurveyToJSON(surveyId: string): string {
    const survey = getSurveyById(surveyId);
    const responses = getResponsesBySurveyId(surveyId);

    return JSON.stringify({
        survey,
        responses,
        exportedAt: new Date().toISOString()
    }, null, 2);
}

// Export responses to CSV
export function exportResponsesToCSV(surveyId: string): string {
    const survey = getSurveyById(surveyId);
    const responses = getResponsesBySurveyId(surveyId);

    if (!survey || responses.length === 0) return '';

    // Create CSV header
    const headers = ['回答ID', '回答日時'];
    survey.questions.forEach(q => {
        headers.push(q.questionText);
    });
    headers.push('AIテーマ', 'AI要約', 'キーワード');

    // Create CSV rows
    const rows = responses.map(response => {
        const row = [response.id, response.submittedAt];

        // 選択式の回答
        survey.questions.forEach(question => {
            const answer = response.choiceAnswers.find(a => a.questionId === question.id);

            if (!answer) {
                row.push('');
            } else {
                row.push(Array.isArray(answer.answer)
                    ? answer.answer.join(', ')
                    : answer.answer || '');
            }
        });

        // AI関連
        row.push(response.aiTheme || '');
        row.push(response.aiSummary || '');
        row.push(response.aiKeywords?.join(', ') || '');

        return row;
    });

    // Combine header and rows
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    return csvContent;
}

// Import from JSON
export function importSurveyFromJSON(jsonString: string): void {
    try {
        const data = JSON.parse(jsonString);

        if (data.survey) {
            saveSurvey(data.survey);
        }

        if (data.responses && Array.isArray(data.responses)) {
            data.responses.forEach((response: Response) => {
                saveResponse(response);
            });
        }
    } catch (error) {
        console.error('Failed to import survey:', error);
        throw new Error('Invalid JSON format');
    }
}
