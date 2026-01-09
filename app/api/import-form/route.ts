import { NextRequest, NextResponse } from 'next/server';
import { extractFormId, parseFormData, convertToSurvey } from '@/lib/google-forms-parser';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URLを入力してください' },
                { status: 400 }
            );
        }

        // Extract form ID from URL
        const formId = extractFormId(url);
        if (!formId) {
            return NextResponse.json(
                { error: '有効なGoogle Forms URLを入力してください' },
                { status: 400 }
            );
        }

        // Construct viewform URL
        const viewformUrl = url.includes('/viewform')
            ? url
            : `https://docs.google.com/forms/d/e/${formId}/viewform`;

        // Fetch the form HTML
        const response = await fetch(viewformUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'フォームの取得に失敗しました。URLが正しいか、フォームが公開されているか確認してください。' },
                { status: 404 }
            );
        }

        const html = await response.text();

        // Parse form data
        const formData = parseFormData(html);
        if (!formData) {
            return NextResponse.json(
                { error: 'フォームデータの解析に失敗しました。Google Formsの構造が変更された可能性があります。' },
                { status: 500 }
            );
        }

        // Convert to ChatAsk format
        const { survey, warnings } = convertToSurvey(formData);

        if (survey.questions && survey.questions.length === 0) {
            return NextResponse.json(
                {
                    error: 'サポートされている質問タイプ（ラジオボタン、チェックボックス）が見つかりませんでした。',
                    warnings
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            survey,
            warnings
        });

    } catch (error) {
        console.error('Error importing form:', error);
        return NextResponse.json(
            { error: 'フォームのインポート中にエラーが発生しました' },
            { status: 500 }
        );
    }
}
