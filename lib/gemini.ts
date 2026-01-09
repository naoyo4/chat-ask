import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationMessage, ChoiceAnswer, Question } from '@/types';

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';

if (!apiKey) {
    console.warn('Google Gemini API key is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

// 選択式の回答を分析してテーマと初期質問を生成
export async function analyzeResponsesAndGenerateTheme(
    questions: Question[],
    choiceAnswers: ChoiceAnswer[]
): Promise<{ theme: string; initialQuestion: string }> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const analysisPrompt = `
あなたはアンケート分析の専門家です。
以下のアンケート回答を分析し、深掘りインタビューのテーマを決定してください。

【質問と回答】
${questions.map((q, i) => {
        const answer = choiceAnswers.find(a => a.questionId === q.id);
        const answerText = answer
            ? (Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer)
            : '未回答';
        return `Q${i + 1}. ${q.questionText}\n回答: ${answerText}`;
    }).join('\n\n')}

【タスク】
1. 回答パターンから重要な傾向や特徴を分析してください
2. 最も深掘りすべきテーマを1つ決定してください
3. そのテーマに関する最初の質問を生成してください

【ルール】
- テーマは1文で簡潔に
- 初期質問は具体的で答えやすいものにする
- 回答者の立場に立った質問をする

【出力形式】
必ず以下のJSON形式で出力してください:
{
  "theme": "深掘りテーマ（1文）",
  "initialQuestion": "最初の質問"
}
`;

    const result = await model.generateContent(analysisPrompt);
    const response = result.response;
    const text = response.text().trim();

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    // フォールバック
    return {
        theme: "回答内容についての詳細",
        initialQuestion: "先ほどの回答について、もう少し詳しく教えていただけますか？"
    };
}

// 対話を継続（次の質問を生成）
export async function generateNextQuestion(
    conversationHistory: ConversationMessage[],
    theme: string,
    maxTurns: number = 5
): Promise<string | null> {
    const currentTurn = Math.floor(conversationHistory.length / 2) + 1;

    if (currentTurn >= maxTurns) {
        return null; // 対話終了
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
あなたはインタビュアーです。
以下のテーマに沿って、ユーザーから有益な情報を引き出してください。

【インタビューテーマ】
${theme}

【これまでの対話】
${conversationHistory.map(msg => `${msg.role === 'ai' ? 'あなた' : 'ユーザー'}: ${msg.content}`).join('\n')}

【ルール】
1. 1回の質問は簡潔に（1-2文）
2. ユーザーの回答に基づいて深掘りする
3. 具体例や詳細を引き出す
4. 最大${maxTurns}ターンで完結させる（現在${currentTurn}/${maxTurns}ターン目）
5. 誘導尋問は避ける

次の質問を1つだけ生成してください。質問文のみを返してください。
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
}

// 対話の要約を生成
export async function generateSummary(
    conversationHistory: ConversationMessage[]
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
以下の対話内容を簡潔に要約してください。
ユーザーが述べた主要なポイントを3-5文でまとめてください。

【対話内容】
${conversationHistory.map(msg => `${msg.role === 'ai' ? 'AI' : 'ユーザー'}: ${msg.content}`).join('\n')}

要約:
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
}

// キーワードを抽出
export async function extractKeywords(
    conversationHistory: ConversationMessage[]
): Promise<string[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `
以下の対話内容から重要なキーワードを5-10個抽出してください。
キーワードはカンマ区切りで返してください。

【対話内容】
${conversationHistory.map(msg => `${msg.role === 'ai' ? 'AI' : 'ユーザー'}: ${msg.content}`).join('\n')}

キーワード（カンマ区切り）:
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    return text.split(',').map(keyword => keyword.trim()).filter(k => k.length > 0);
}
