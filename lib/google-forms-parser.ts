import { Survey, Question, QuestionType } from '@/types';
import { generateId } from './utils';

export interface ParsedFormData {
    title: string;
    description: string;
    questions: ParsedQuestion[];
}

export interface ParsedQuestion {
    questionText: string;
    type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'dropdown' | 'scale' | 'grid' | 'date' | 'time' | 'unknown';
    options: string[];
    required: boolean;
}

/**
 * Extract form ID from Google Forms URL
 * Supports both edit and view URLs
 */
export function extractFormId(url: string): string | null {
    try {
        // Pattern: /forms/d/{formId}/edit or /forms/d/e/{publishedFormId}/viewform
        const patterns = [
            /\/forms\/d\/([a-zA-Z0-9-_]+)\/edit/,
            /\/forms\/d\/e\/([a-zA-Z0-9-_]+)\/viewform/,
            /\/forms\/d\/([a-zA-Z0-9-_]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting form ID:', error);
        return null;
    }
}

/**
 * Parse Google Forms HTML to extract form data
 * Looks for FB_PUBLIC_LOAD_DATA_ variable in the HTML
 */
export function parseFormData(html: string): ParsedFormData | null {
    try {
        // Find FB_PUBLIC_LOAD_DATA_ variable
        const match = html.match(/var FB_PUBLIC_LOAD_DATA_ = ([\s\S]*?);/);
        if (!match) {
            console.error('Could not find FB_PUBLIC_LOAD_DATA_ in HTML');
            return null;
        }

        // Parse the JSON data
        const jsonData = JSON.parse(match[1]);

        // The structure is typically: [null, [formData]]
        const formData = jsonData[1];
        if (!formData || !Array.isArray(formData)) {
            console.error('Invalid form data structure');
            return null;
        }

        // Extract title and description
        const title = formData[8] || 'Untitled Form';
        const description = formData[0] || '';

        // Extract questions - typically in formData[1]
        const questionsData = formData[1];
        const questions: ParsedQuestion[] = [];

        if (questionsData && Array.isArray(questionsData)) {
            for (const questionData of questionsData) {
                if (!questionData || !Array.isArray(questionData)) continue;

                const questionText = questionData[1] || '';
                const questionType = questionData[3]; // Question type ID
                const isRequired = questionData[4]?.[0]?.[2] === 1;

                // Extract options if available
                let options: string[] = [];
                const optionsData = questionData[4]?.[0]?.[1];
                if (optionsData && Array.isArray(optionsData)) {
                    options = optionsData.map((opt: any) => opt[0] || '').filter((opt: string) => opt);
                }

                // Map Google Forms question types to our types
                let type: ParsedQuestion['type'] = 'unknown';
                switch (questionType) {
                    case 2: // Radio (single choice)
                        type = 'radio';
                        break;
                    case 4: // Checkbox (multiple choice)
                        type = 'checkbox';
                        break;
                    case 0: // Short text
                        type = 'text';
                        break;
                    case 1: // Long text (paragraph)
                        type = 'textarea';
                        break;
                    case 3: // Dropdown
                        type = 'dropdown';
                        break;
                    case 5: // Linear scale
                        type = 'scale';
                        break;
                    case 7: // Multiple choice grid
                        type = 'grid';
                        break;
                    case 9: // Date
                        type = 'date';
                        break;
                    case 10: // Time
                        type = 'time';
                        break;
                }

                questions.push({
                    questionText,
                    type,
                    options,
                    required: isRequired
                });
            }
        }

        return {
            title,
            description,
            questions
        };
    } catch (error) {
        console.error('Error parsing form data:', error);
        return null;
    }
}

/**
 * Convert parsed form data to ChatAsk Survey format
 * Only includes supported question types (radio, checkbox)
 */
export function convertToSurvey(formData: ParsedFormData): {
    survey: Partial<Survey>;
    warnings: string[];
} {
    const warnings: string[] = [];
    const supportedQuestions: Question[] = [];

    formData.questions.forEach((question, index) => {
        // Only support radio and checkbox for now
        if (question.type === 'radio' || question.type === 'checkbox') {
            const chatAskQuestion: Question = {
                id: generateId(),
                surveyId: '', // Will be set when survey is created
                order: supportedQuestions.length,
                type: question.type as QuestionType,
                questionText: question.questionText,
                options: question.options.length > 0 ? question.options : [''],
                required: question.required
            };
            supportedQuestions.push(chatAskQuestion);
        } else {
            // Add warning for unsupported question types
            const typeLabel = {
                text: 'テキスト入力',
                textarea: '段落テキスト',
                dropdown: 'プルダウン',
                scale: 'スケール',
                grid: 'グリッド',
                date: '日付',
                time: '時刻',
                unknown: '不明な形式'
            }[question.type] || question.type;

            warnings.push(
                `質問 ${index + 1} "${question.questionText}" (${typeLabel}) はサポートされていないためスキップされました。`
            );
        }
    });

    const survey: Partial<Survey> = {
        title: formData.title,
        description: formData.description,
        questions: supportedQuestions
    };

    return { survey, warnings };
}
