import { NextRequest, NextResponse } from 'next/server';
import { generateNextQuestion, generateSummary, extractKeywords } from '@/lib/gemini';
import { ConversationMessage } from '@/types';

export async function POST(req: NextRequest) {
    try {
        const { conversationHistory, theme, maxTurns } = await req.json() as {
            conversationHistory: ConversationMessage[];
            theme: string;
            maxTurns?: number;
        };

        const nextQuestion = await generateNextQuestion(
            conversationHistory,
            theme,
            maxTurns || 5
        );

        // 対話終了の場合は要約とキーワードを生成
        if (!nextQuestion) {
            const summary = await generateSummary(conversationHistory);
            const keywords = await extractKeywords(conversationHistory);

            return NextResponse.json({
                nextQuestion: null,
                summary,
                keywords,
                isComplete: true
            });
        }

        return NextResponse.json({
            nextQuestion,
            isComplete: false
        });
    } catch (error) {
        console.error('AI chat error:', error);
        return NextResponse.json(
            { error: 'Failed to process AI conversation' },
            { status: 500 }
        );
    }
}
