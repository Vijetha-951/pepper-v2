import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReviewSentimentService {
  /**
   * Execute Python sentiment classifier script
   * @param {Array} reviews - Array of reviews to analyze
   * @param {string} method - Method to call ('analyze' or 'summary')
   * @returns {Promise} Result from Python script
   */
  static executePythonScript(reviews, method = 'analyze') {
    return new Promise((resolve, reject) => {
      const pythonScriptPath = path.join(
        __dirname,
        '../../python/review_sentiment_classifier.py'
      );

      const pythonProcess = spawn('python', [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python stderr:', errorOutput);
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
        } else {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${output}`));
          }
        }
      });

      // Send data to Python process
      pythonProcess.stdin.write(JSON.stringify({
        reviews,
        method
      }));
      pythonProcess.stdin.end();
    });
  }

  /**
   * Analyze reviews for sentiment (fallback to JavaScript implementation)
   * @param {Array} reviews - Array of reviews
   * @returns {Array} Analyzed reviews with sentiment
   */
  static analyzeReviews(reviews) {
    return reviews.map((review) => {
      const rating = review.rating || 3;
      const comment = review.comment || '';
      const complaintType = review.complaintType || 'None';

      // Classify sentiment based on rating and content
      let sentiment = 'NEUTRAL';
      let confidence = 50;
      const keywords = [];

      // Simple heuristic-based sentiment analysis
      const positiveWords = [
        'excellent', 'great', 'good', 'amazing', 'perfect', 'love',
        'beautiful', 'fantastic', 'wonderful', 'happy', 'satisfied',
        'best', 'awesome', 'nice', 'lovely', 'healthy', 'fresh',
        'quality', 'recommend', 'thanks'
      ];

      const negativeWords = [
        'bad', 'poor', 'terrible', 'awful', 'hate', 'worst',
        'broken', 'damaged', 'dead', 'rotten', 'waste', 'disappointed',
        'unhappy', 'wrong', 'late', 'delay', 'problem', 'issue',
        'defective', 'refund', 'complaint'
      ];

      const commentLower = comment.toLowerCase();
      const positiveCount = positiveWords.filter(w => commentLower.includes(w)).length;
      const negativeCount = negativeWords.filter(w => commentLower.includes(w)).length;

      // Determine sentiment
      if (rating >= 4) {
        sentiment = 'POSITIVE';
        confidence = Math.min(80 + positiveCount * 5, 95);
      } else if (rating <= 2) {
        sentiment = 'NEGATIVE';
        confidence = Math.min(80 + negativeCount * 5, 95);
      } else {
        sentiment = 'NEUTRAL';
        confidence = 60;
      }

      // Adjust confidence based on text length
      const textLength = comment.split(' ').length;
      if (textLength < 3) {
        confidence = Math.max(confidence - 15, 40);
      } else if (textLength > 30) {
        confidence = Math.min(confidence + 10, 100);
      }

      // Extract keywords
      const words = comment.split(/\s+/).filter(w => w.length > 3);
      const extractedKeywords = words.slice(0, 5);

      return {
        _id: review._id,
        rating,
        comment,
        complaintType,
        sentiment,
        sentimentConfidence: confidence,
        keywords: extractedKeywords.length > 0 ? extractedKeywords : ['no-keywords'],
        isProblematic: rating <= 2 || sentiment === 'NEGATIVE' || complaintType !== 'None',
        user: review.user,
        product: review.product,
        createdAt: review.createdAt
      };
    });
  }

  /**
   * Get sentiment summary statistics
   * @param {Array} reviews - Array of reviews
   * @returns {Object} Summary statistics
   */
  static getSentimentSummary(reviews) {
    const analyzed = this.analyzeReviews(reviews);

    const totalReviews = analyzed.length;
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        positiveSentiment: 0,
        negativeSentiment: 0,
        neutralSentiment: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        averageRating: 0,
        averageConfidence: 0,
        problematicReviews: [],
        analyzedAt: new Date().toISOString()
      };
    }

    // Count sentiments
    const positivCount = analyzed.filter(r => r.sentiment === 'POSITIVE').length;
    const negativeCount = analyzed.filter(r => r.sentiment === 'NEGATIVE').length;
    const neutralCount = analyzed.filter(r => r.sentiment === 'NEUTRAL').length;

    // Get problematic reviews
    const problematic = analyzed
      .filter(r => r.isProblematic)
      .sort((a, b) => b.sentimentConfidence - a.sentimentConfidence)
      .slice(0, 10);

    // Calculate averages
    const avgRating = analyzed.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    const avgConfidence = Math.round(
      analyzed.reduce((sum, r) => sum + r.sentimentConfidence, 0) / totalReviews
    );

    return {
      totalReviews,
      positiveSentiment: positivCount,
      negativeSentiment: negativeCount,
      neutralSentiment: neutralCount,
      positivePercentage: parseFloat(((positivCount / totalReviews) * 100).toFixed(1)),
      negativePercentage: parseFloat(((negativeCount / totalReviews) * 100).toFixed(1)),
      neutralPercentage: parseFloat(((neutralCount / totalReviews) * 100).toFixed(1)),
      averageRating: parseFloat(avgRating.toFixed(2)),
      averageConfidence: avgConfidence,
      problematicReviews: problematic.map(r => ({
        _id: r._id,
        rating: r.rating,
        sentiment: r.sentiment,
        confidence: r.sentimentConfidence,
        comment: r.comment.length > 100 ? r.comment.substring(0, 100) + '...' : r.comment,
        complaintType: r.complaintType,
        userName: r.user?.firstName ? `${r.user.firstName} ${r.user.lastName || ''}` : 'Unknown',
        productName: r.product?.name || 'Unknown'
      })),
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Get sentiment for a single product
   * @param {string} productId - Product ID
   * @param {Array} reviews - All reviews
   * @returns {Object} Product sentiment summary
   */
  static getProductSentiment(productId, reviews) {
    const productReviews = reviews.filter(r => r.product && r.product._id === productId);
    
    if (productReviews.length === 0) {
      return {
        productId,
        totalReviews: 0,
        averageRating: 0,
        sentiment: 'NEUTRAL',
        distribution: { positive: 0, negative: 0, neutral: 0 }
      };
    }

    const analyzed = this.analyzeReviews(productReviews);
    const positive = analyzed.filter(r => r.sentiment === 'POSITIVE').length;
    const negative = analyzed.filter(r => r.sentiment === 'NEGATIVE').length;
    const neutral = analyzed.filter(r => r.sentiment === 'NEUTRAL').length;

    const avgRating = analyzed.reduce((sum, r) => sum + r.rating, 0) / analyzed.length;
    
    let overallSentiment = 'NEUTRAL';
    if (positive > negative && positive > neutral) {
      overallSentiment = 'POSITIVE';
    } else if (negative > positive && negative > neutral) {
      overallSentiment = 'NEGATIVE';
    }

    return {
      productId,
      totalReviews: analyzed.length,
      averageRating: parseFloat(avgRating.toFixed(2)),
      sentiment: overallSentiment,
      distribution: {
        positive: parseFloat(((positive / analyzed.length) * 100).toFixed(1)),
        negative: parseFloat(((negative / analyzed.length) * 100).toFixed(1)),
        neutral: parseFloat(((neutral / analyzed.length) * 100).toFixed(1))
      },
      topProblems: analyzed
        .filter(r => r.sentiment === 'NEGATIVE')
        .slice(0, 3)
        .map(r => r.comment.substring(0, 50))
    };
  }
}

export default ReviewSentimentService;