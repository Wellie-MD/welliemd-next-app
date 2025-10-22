/**
 * Flow Generator Service Tests
 * 
 * Tests for the flow generation service that converts API responses
 * into React-Flow compatible nodes and edges.
 */

import { describe, it, expect } from 'vitest';
import { 
  generateFlowFromTemplate,
  addQuestionToFlow,
  removeQuestionFromFlow 
} from '../flowGeneratorService';
import { QuestionnaireTemplate, Question } from '@/api/questionnaires';

describe('Flow Generator Service', () => {
  describe('generateFlowFromTemplate', () => {
    it('should generate nodes for all questions', () => {
      const template: QuestionnaireTemplate = {
        id: 'template-1',
        name: 'Test Template',
        questionnaire_type: 'intake',
        requires_photo_upload: false,
        requires_identity_verification: false,
        is_published: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        questions: [
          {
            id: 'q1',
            question_text: 'Question 1',
            question_type: 'text',
            is_required: true,
            order_index: 1,
            answer_choices: [],
            conditional_logic: {},
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'q2',
            question_text: 'Question 2',
            question_type: 'text',
            is_required: true,
            order_index: 2,
            answer_choices: [],
            conditional_logic: {},
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      };

      const result = generateFlowFromTemplate(template, false);

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].id).toBe('q1');
      expect(result.nodes[1].id).toBe('q2');
      expect(result.stats.totalQuestions).toBe(2);
    });

    it('should create follow-up edges based on conditional_logic', () => {
      const template: QuestionnaireTemplate = {
        id: 'template-1',
        name: 'Test Template',
        questionnaire_type: 'intake',
        requires_photo_upload: false,
        requires_identity_verification: false,
        is_published: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        questions: [
          {
            id: 'q1',
            question_text: 'Do you have symptoms?',
            question_type: 'single_choice',
            is_required: true,
            order_index: 1,
            answer_choices: ['Yes', 'No'],
            conditional_logic: {},
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'q2',
            question_text: 'Describe your symptoms',
            question_type: 'textarea',
            is_required: true,
            order_index: 2,
            answer_choices: [],
            conditional_logic: {
              show_if: {
                question_id: 'q1',
                value: 'Yes',
                operator: 'equals',
              },
            },
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      };

      const result = generateFlowFromTemplate(template, false);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('q1');
      expect(result.edges[0].target).toBe('q2');
      expect(result.edges[0].sourceHandle).toBe('choice-0');
      expect(result.stats.conditionalQuestions).toBe(1);
    });

    it('should create disqualify nodes and edges', () => {
      const template: QuestionnaireTemplate = {
        id: 'template-1',
        name: 'Test Template',
        questionnaire_type: 'intake',
        requires_photo_upload: false,
        requires_identity_verification: false,
        is_published: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        questions: [
          {
            id: 'q1',
            question_text: 'What is your age?',
            question_type: 'single_choice',
            is_required: true,
            order_index: 1,
            answer_choices: ['Under 18', '18-65', 'Over 65'],
            conditional_logic: {
              disqualify_if: [
                {
                  value: 'Under 18',
                  reason: 'Must be 18 or older',
                },
              ],
            },
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      };

      const result = generateFlowFromTemplate(template, false);

      // Should have 1 question node + 1 disqualify node
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1].type).toBe('disqualifyNode');
      expect(result.nodes[1].data.reason).toBe('Must be 18 or older');
      
      // Should have 1 edge to disqualify node
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('q1');
      expect(result.edges[0].target).toBe('disqualify-q1-0');
      expect(result.stats.disqualifyNodes).toBe(1);
    });

    it('should identify root nodes correctly', () => {
      const template: QuestionnaireTemplate = {
        id: 'template-1',
        name: 'Test Template',
        questionnaire_type: 'intake',
        requires_photo_upload: false,
        requires_identity_verification: false,
        is_published: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        questions: [
          {
            id: 'q1',
            question_text: 'Root Question 1',
            question_type: 'text',
            is_required: true,
            order_index: 1,
            answer_choices: ['Yes', 'No'],
            conditional_logic: {},
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'q2',
            question_text: 'Follow-up Question',
            question_type: 'text',
            is_required: true,
            order_index: 2,
            answer_choices: [],
            conditional_logic: {
              show_if: {
                question_id: 'q1',
                value: 'Yes',
                operator: 'equals',
              },
            },
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'q3',
            question_text: 'Root Question 2',
            question_type: 'text',
            is_required: true,
            order_index: 3,
            answer_choices: [],
            conditional_logic: {},
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      };

      const result = generateFlowFromTemplate(template, false);

      expect(result.rootNodes).toHaveLength(2);
      expect(result.rootNodes).toContain('q1');
      expect(result.rootNodes).toContain('q3');
      expect(result.stats.rootQuestions).toBe(2);
    });

    it('should handle empty questions array', () => {
      const template: QuestionnaireTemplate = {
        id: 'template-1',
        name: 'Test Template',
        questionnaire_type: 'intake',
        requires_photo_upload: false,
        requires_identity_verification: false,
        is_published: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        questions: [],
      };

      const result = generateFlowFromTemplate(template, false);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.rootNodes).toHaveLength(0);
      expect(result.stats.totalQuestions).toBe(0);
    });

    it('should handle multiple disqualify conditions', () => {
      const template: QuestionnaireTemplate = {
        id: 'template-1',
        name: 'Test Template',
        questionnaire_type: 'intake',
        requires_photo_upload: false,
        requires_identity_verification: false,
        is_published: false,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        questions: [
          {
            id: 'q1',
            question_text: 'Select conditions',
            question_type: 'multiple_choice',
            is_required: true,
            order_index: 1,
            answer_choices: ['Condition A', 'Condition B', 'Condition C'],
            conditional_logic: {
              disqualify_if: [
                {
                  value: 'Condition A',
                  reason: 'Reason A',
                },
                {
                  value: 'Condition B',
                  reason: 'Reason B',
                },
              ],
            },
            validation_rules: {},
            beluga_field_mapping: '',
            include_in_qa_section: true,
            is_client_custom: false,
            can_be_modified: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      };

      const result = generateFlowFromTemplate(template, false);

      // Should have 1 question + 2 disqualify nodes
      expect(result.nodes).toHaveLength(3);
      expect(result.stats.disqualifyNodes).toBe(2);
      
      // Should have 2 disqualify edges
      expect(result.edges).toHaveLength(2);
    });
  });

  describe('addQuestionToFlow', () => {
    it('should add a new question to existing flow', () => {
      const existingNodes = [
        {
          id: 'q1',
          type: 'questionNode',
          position: { x: 100, y: 100 },
          data: {
            question: {
              id: 'q1',
              question_text: 'Question 1',
              answer_choices: ['Yes', 'No'],
            } as Question,
          },
        },
      ];

      const existingEdges = [];

      const newQuestion: Question = {
        id: 'q2',
        question_text: 'Question 2',
        question_type: 'text',
        is_required: true,
        order_index: 2,
        answer_choices: [],
        conditional_logic: {
          show_if: {
            question_id: 'q1',
            value: 'Yes',
            operator: 'equals',
          },
        },
        validation_rules: {},
        beluga_field_mapping: '',
        include_in_qa_section: true,
        is_client_custom: false,
        can_be_modified: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = addQuestionToFlow(
        existingNodes,
        existingEdges,
        newQuestion,
        false
      );

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('q1');
      expect(result.edges[0].target).toBe('q2');
    });
  });

  describe('removeQuestionFromFlow', () => {
    it('should remove question and related edges', () => {
      const nodes = [
        {
          id: 'q1',
          type: 'questionNode',
          position: { x: 100, y: 100 },
          data: { question: { id: 'q1' } as Question },
        },
        {
          id: 'q2',
          type: 'questionNode',
          position: { x: 200, y: 200 },
          data: { question: { id: 'q2' } as Question },
        },
        {
          id: 'q3',
          type: 'questionNode',
          position: { x: 300, y: 300 },
          data: { question: { id: 'q3' } as Question },
        },
      ];

      const edges = [
        {
          id: 'e1',
          source: 'q1',
          target: 'q2',
        },
        {
          id: 'e2',
          source: 'q2',
          target: 'q3',
        },
      ];

      const result = removeQuestionFromFlow(nodes, edges, 'q2');

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes.find(n => n.id === 'q2')).toBeUndefined();
      
      expect(result.edges).toHaveLength(0);
    });

    it('should remove disqualify nodes associated with question', () => {
      const nodes = [
        {
          id: 'q1',
          type: 'questionNode',
          position: { x: 100, y: 100 },
          data: { question: { id: 'q1' } as Question },
        },
        {
          id: 'disqualify-q1-0',
          type: 'disqualifyNode',
          position: { x: 200, y: 100 },
          data: { reason: 'Disqualified' },
        },
      ];

      const edges = [
        {
          id: 'e1',
          source: 'q1',
          target: 'disqualify-q1-0',
        },
      ];

      const result = removeQuestionFromFlow(nodes, edges, 'q1');

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });
  });
});
