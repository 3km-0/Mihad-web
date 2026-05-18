export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          action_type: string
          cost_cents: number | null
          created_at: string
          id: string
          input_json: Json | null
          input_text: string | null
          latency_ms: number | null
          model_used: string | null
          org_id: string | null
          output_json: Json | null
          output_text: string | null
          plugin_family: string | null
          related_entity_ids: string[] | null
          related_task_ids: string[] | null
          status: string
          target_document_ids: string[] | null
          target_selection_ids: string[] | null
          triggered_by_user_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          cost_cents?: number | null
          created_at?: string
          id?: string
          input_json?: Json | null
          input_text?: string | null
          latency_ms?: number | null
          model_used?: string | null
          org_id?: string | null
          output_json?: Json | null
          output_text?: string | null
          plugin_family?: string | null
          related_entity_ids?: string[] | null
          related_task_ids?: string[] | null
          status?: string
          target_document_ids?: string[] | null
          target_selection_ids?: string[] | null
          triggered_by_user_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          cost_cents?: number | null
          created_at?: string
          id?: string
          input_json?: Json | null
          input_text?: string | null
          latency_ms?: number | null
          model_used?: string | null
          org_id?: string | null
          output_json?: Json | null
          output_text?: string | null
          plugin_family?: string | null
          related_entity_ids?: string[] | null
          related_task_ids?: string[] | null
          status?: string
          target_document_ids?: string[] | null
          target_selection_ids?: string[] | null
          triggered_by_user_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activation_opportunities: {
        Row: {
          created_at: string
          created_by: string | null
          economics_json: Json
          hard_stops_json: Json
          id: string
          mandate_id: string | null
          missing_fields_json: Json
          notes: string | null
          party_type: string
          rfq_id: string | null
          route_recommendation: string
          score_json: Json
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          economics_json?: Json
          hard_stops_json?: Json
          id?: string
          mandate_id?: string | null
          missing_fields_json?: Json
          notes?: string | null
          party_type: string
          rfq_id?: string | null
          route_recommendation?: string
          score_json?: Json
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          economics_json?: Json
          hard_stops_json?: Json
          id?: string
          mandate_id?: string | null
          missing_fields_json?: Json
          notes?: string | null
          party_type?: string
          rfq_id?: string | null
          route_recommendation?: string
          score_json?: Json
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_opportunities_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_opportunities_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_events: {
        Row: {
          body_text: string | null
          channel: string
          created_at: string
          created_by: string | null
          event_direction: string
          event_payload: Json
          event_type: string
          id: string
          mandate_id: string | null
          rfq_id: string | null
          thread_id: string | null
          workspace_id: string | null
        }
        Insert: {
          body_text?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          event_direction?: string
          event_payload?: Json
          event_type: string
          id?: string
          mandate_id?: string | null
          rfq_id?: string | null
          thread_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          body_text?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          event_direction?: string
          event_payload?: Json
          event_type?: string
          id?: string
          mandate_id?: string | null
          rfq_id?: string | null
          thread_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_events_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_events_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_outbox_messages: {
        Row: {
          approval_gate_id: string | null
          body_text: string
          channel: string
          created_at: string
          created_by: string | null
          id: string
          metadata_json: Json
          partner_id: string | null
          recipient_json: Json
          status: string
          subject: string | null
          thread_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          approval_gate_id?: string | null
          body_text: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata_json?: Json
          partner_id?: string | null
          recipient_json?: Json
          status?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          approval_gate_id?: string | null
          body_text?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata_json?: Json
          partner_id?: string | null
          recipient_json?: Json
          status?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_outbox_messages_approval_gate_id_fkey"
            columns: ["approval_gate_id"]
            isOneToOne: false
            referencedRelation: "approval_gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outbox_messages_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outbox_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "agent_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_outbox_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_threads: {
        Row: {
          buyer_entity_id: string | null
          channel: string
          created_at: string
          created_by: string | null
          external_thread_id: string | null
          id: string
          last_message_at: string | null
          mandate_id: string | null
          rfq_id: string | null
          state_json: Json
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          buyer_entity_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          mandate_id?: string | null
          rfq_id?: string | null
          state_json?: Json
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          buyer_entity_id?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          external_thread_id?: string | null
          id?: string
          last_message_at?: string | null
          mandate_id?: string | null
          rfq_id?: string | null
          state_json?: Json
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_threads_buyer_entity_id_fkey"
            columns: ["buyer_entity_id"]
            isOneToOne: false
            referencedRelation: "buyer_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_threads_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_threads_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_threads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_gates: {
        Row: {
          action_type: string
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          buyer_profile_id: string | null
          created_at: string
          draft_payload_json: Json
          executed_at: string | null
          executed_by: string | null
          execution_result_json: Json
          id: string
          mandate_id: string | null
          match_id: string | null
          partner_id: string | null
          requested_by: string | null
          rfq_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          action_type: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          buyer_profile_id?: string | null
          created_at?: string
          draft_payload_json?: Json
          executed_at?: string | null
          executed_by?: string | null
          execution_result_json?: Json
          id?: string
          mandate_id?: string | null
          match_id?: string | null
          partner_id?: string | null
          requested_by?: string | null
          rfq_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          action_type?: string
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          buyer_profile_id?: string | null
          created_at?: string
          draft_payload_json?: Json
          executed_at?: string | null
          executed_by?: string | null
          execution_result_json?: Json
          id?: string
          mandate_id?: string | null
          match_id?: string | null
          partner_id?: string | null
          requested_by?: string | null
          rfq_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_gates_buyer_profile_id_fkey"
            columns: ["buyer_profile_id"]
            isOneToOne: false
            referencedRelation: "buyer_readiness_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_gates_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_gates_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_gates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_gates_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_gates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_model_rates: {
        Row: {
          cached_input_token_multiplier: number
          created_at: string
          embedding_token_multiplier: number
          input_token_multiplier: number
          is_active: boolean
          model_key: string
          notes: string | null
          output_token_multiplier: number
          provider: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          cached_input_token_multiplier?: number
          created_at?: string
          embedding_token_multiplier?: number
          input_token_multiplier?: number
          is_active?: boolean
          model_key: string
          notes?: string | null
          output_token_multiplier?: number
          provider: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          cached_input_token_multiplier?: number
          created_at?: string
          embedding_token_multiplier?: number
          input_token_multiplier?: number
          is_active?: boolean
          model_key?: string
          notes?: string | null
          output_token_multiplier?: number
          provider?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      billing_operation_rates: {
        Row: {
          billable_ops_per_unit: number
          created_at: string
          is_active: boolean
          notes: string | null
          operation_key: string
          provider: string
          source_url: string | null
          unit_label: string
          updated_at: string
        }
        Insert: {
          billable_ops_per_unit: number
          created_at?: string
          is_active?: boolean
          notes?: string | null
          operation_key: string
          provider: string
          source_url?: string | null
          unit_label?: string
          updated_at?: string
        }
        Update: {
          billable_ops_per_unit?: number
          created_at?: string
          is_active?: boolean
          notes?: string | null
          operation_key?: string
          provider?: string
          source_url?: string | null
          unit_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_usage_monthly: {
        Row: {
          billable_ops_used: number
          breakdown: Json
          created_at: string
          metered_tokens_used: number
          period_end: string
          period_start: string
          raw_cached_input_tokens: number
          raw_embedding_tokens: number
          raw_input_tokens: number
          raw_output_tokens: number
          storage_bytes_snapshot: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billable_ops_used?: number
          breakdown?: Json
          created_at?: string
          metered_tokens_used?: number
          period_end: string
          period_start: string
          raw_cached_input_tokens?: number
          raw_embedding_tokens?: number
          raw_input_tokens?: number
          raw_output_tokens?: number
          storage_bytes_snapshot?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billable_ops_used?: number
          breakdown?: Json
          created_at?: string
          metered_tokens_used?: number
          period_end?: string
          period_start?: string
          raw_cached_input_tokens?: number
          raw_embedding_tokens?: number
          raw_input_tokens?: number
          raw_output_tokens?: number
          storage_bytes_snapshot?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_usage_monthly_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_entities: {
        Row: {
          created_at: string
          display_name: string
          entity_type: string
          id: string
          legal_name: string | null
          metadata_json: Json
          organization_id: string | null
          owner_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          entity_type?: string
          id?: string
          legal_name?: string | null
          metadata_json?: Json
          organization_id?: string | null
          owner_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          entity_type?: string
          id?: string
          legal_name?: string | null
          metadata_json?: Json
          organization_id?: string | null
          owner_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_mandates: {
        Row: {
          budget_currency: string
          budget_range_json: Json
          buyer_entity_id: string | null
          constraints_json: Json
          created_at: string
          id: string
          metadata_json: Json
          notes: string | null
          organization_id: string | null
          purpose: string | null
          readiness_state: string
          status: string
          target_country_codes: string[]
          target_locations_json: Json
          timeline: string | null
          title: string
          updated_at: string
          use_case: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          budget_currency?: string
          budget_range_json?: Json
          buyer_entity_id?: string | null
          constraints_json?: Json
          created_at?: string
          id?: string
          metadata_json?: Json
          notes?: string | null
          organization_id?: string | null
          purpose?: string | null
          readiness_state?: string
          status?: string
          target_country_codes?: string[]
          target_locations_json?: Json
          timeline?: string | null
          title: string
          updated_at?: string
          use_case?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          budget_currency?: string
          budget_range_json?: Json
          buyer_entity_id?: string | null
          constraints_json?: Json
          created_at?: string
          id?: string
          metadata_json?: Json
          notes?: string | null
          organization_id?: string | null
          purpose?: string | null
          readiness_state?: string
          status?: string
          target_country_codes?: string[]
          target_locations_json?: Json
          timeline?: string | null
          title?: string
          updated_at?: string
          use_case?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_mandates_buyer_entity_id_fkey"
            columns: ["buyer_entity_id"]
            isOneToOne: false
            referencedRelation: "buyer_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_mandates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_mandates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_packets: {
        Row: {
          buyer_profile_id: string
          consent_scope_json: Json
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          mandate_id: string | null
          revoked_at: string | null
          revoked_reason: string | null
          snapshot_json: Json
          status: string
          updated_at: string
          version: number
          workspace_id: string | null
        }
        Insert: {
          buyer_profile_id: string
          consent_scope_json?: Json
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          mandate_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          snapshot_json?: Json
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Update: {
          buyer_profile_id?: string
          consent_scope_json?: Json
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          mandate_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          snapshot_json?: Json
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_packets_buyer_profile_id_fkey"
            columns: ["buyer_profile_id"]
            isOneToOne: false
            referencedRelation: "buyer_readiness_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_packets_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_packets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_readiness_evidence: {
        Row: {
          attestation_json: Json
          created_at: string
          created_by: string | null
          document_id: string | null
          evidence_type: string
          expires_at: string | null
          id: string
          profile_id: string
          sensitivity_level: string
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          workspace_id: string | null
        }
        Insert: {
          attestation_json?: Json
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          evidence_type: string
          expires_at?: string | null
          id?: string
          profile_id: string
          sensitivity_level?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          workspace_id?: string | null
        }
        Update: {
          attestation_json?: Json
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          evidence_type?: string
          expires_at?: string | null
          id?: string
          profile_id?: string
          sensitivity_level?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_readiness_evidence_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_readiness_evidence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "buyer_readiness_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_readiness_evidence_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_readiness_profiles: {
        Row: {
          buyer_entity_id: string | null
          buyer_type: string
          buyer_user_id: string | null
          created_at: string
          created_by: string | null
          evidence_status: string
          funding_path: string | null
          id: string
          mandate_id: string | null
          mandate_summary: string | null
          metadata_json: Json
          organization_id: string | null
          readiness_level: number
          sharing_mode: string
          updated_at: string
          verification_confidence: string
          verification_expires_at: string | null
          workspace_id: string | null
        }
        Insert: {
          buyer_entity_id?: string | null
          buyer_type?: string
          buyer_user_id?: string | null
          created_at?: string
          created_by?: string | null
          evidence_status?: string
          funding_path?: string | null
          id?: string
          mandate_id?: string | null
          mandate_summary?: string | null
          metadata_json?: Json
          organization_id?: string | null
          readiness_level?: number
          sharing_mode?: string
          updated_at?: string
          verification_confidence?: string
          verification_expires_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          buyer_entity_id?: string | null
          buyer_type?: string
          buyer_user_id?: string | null
          created_at?: string
          created_by?: string | null
          evidence_status?: string
          funding_path?: string | null
          id?: string
          mandate_id?: string | null
          mandate_summary?: string | null
          metadata_json?: Json
          organization_id?: string | null
          readiness_level?: number
          sharing_mode?: string
          updated_at?: string
          verification_confidence?: string
          verification_expires_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_readiness_profiles_buyer_entity_id_fkey"
            columns: ["buyer_entity_id"]
            isOneToOne: false
            referencedRelation: "buyer_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_readiness_profiles_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_readiness_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_readiness_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          created_at: string
          document_id: string | null
          ends_at: string | null
          external_calendar_id: string | null
          external_event_id: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          source: string
          starts_at: string
          task_id: string | null
          title: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          document_id?: string | null
          ends_at?: string | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          source?: string
          starts_at: string
          task_id?: string | null
          title: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          all_day?: boolean
          created_at?: string
          document_id?: string | null
          ends_at?: string | null
          external_calendar_id?: string | null
          external_event_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          source?: string
          starts_at?: string
          task_id?: string | null
          title?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_events: {
        Row: {
          apple_event_identifier: string | null
          created_at: string | null
          description: string | null
          document_id: string | null
          end_date: string | null
          google_event_id: string | null
          ics_exported_at: string | null
          id: string
          insight_id: string | null
          is_all_day: boolean | null
          start_date: string
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          apple_event_identifier?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          end_date?: string | null
          google_event_id?: string | null
          ics_exported_at?: string | null
          id?: string
          insight_id?: string | null
          is_all_day?: boolean | null
          start_date: string
          title: string
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          apple_event_identifier?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          end_date?: string | null
          google_event_id?: string | null
          ics_exported_at?: string | null
          id?: string
          insight_id?: string | null
          is_all_day?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_events_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_chunks: {
        Row: {
          canonical_id: string
          chunk_index: number
          content_hash: string
          content_text: string
          created_at: string
          id: string
          language: string | null
          page_number: number | null
        }
        Insert: {
          canonical_id: string
          chunk_index: number
          content_hash: string
          content_text: string
          created_at?: string
          id?: string
          language?: string | null
          page_number?: number | null
        }
        Update: {
          canonical_id?: string
          chunk_index?: number
          content_hash?: string
          content_text?: string
          created_at?: string
          id?: string
          language?: string | null
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_chunks_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "canonical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_documents: {
        Row: {
          author: string | null
          chunk_count: number | null
          content_hash: string
          created_at: string
          edition: string | null
          embedding_status: string | null
          id: string
          is_verified: boolean | null
          isbn: string | null
          language: string | null
          level: string | null
          page_count: number | null
          publisher: string | null
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          chunk_count?: number | null
          content_hash: string
          created_at?: string
          edition?: string | null
          embedding_status?: string | null
          id?: string
          is_verified?: boolean | null
          isbn?: string | null
          language?: string | null
          level?: string | null
          page_count?: number | null
          publisher?: string | null
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          chunk_count?: number | null
          content_hash?: string
          created_at?: string
          edition?: string | null
          embedding_status?: string | null
          id?: string
          is_verified?: boolean | null
          isbn?: string | null
          language?: string | null
          level?: string | null
          page_count?: number | null
          publisher?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      canonical_embeddings: {
        Row: {
          canonical_id: string
          chunk_id: string
          created_at: string
          embedding_model: string
          embedding_version: string
          id: string
          index_name: string
          vector_key: string
        }
        Insert: {
          canonical_id: string
          chunk_id: string
          created_at?: string
          embedding_model: string
          embedding_version: string
          id?: string
          index_name: string
          vector_key: string
        }
        Update: {
          canonical_id?: string
          chunk_id?: string
          created_at?: string
          embedding_model?: string
          embedding_version?: string
          id?: string
          index_name?: string
          vector_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "canonical_embeddings_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "canonical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "canonical_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      chunk_embeddings: {
        Row: {
          chunk_id: string
          content_hash: string
          created_at: string
          dimension: number
          embedding_model: string
          embedding_version: string
          error: string | null
          id: string
          index_name: string
          status: string
          updated_at: string
          vector_key: string
        }
        Insert: {
          chunk_id: string
          content_hash: string
          created_at?: string
          dimension: number
          embedding_model: string
          embedding_version: string
          error?: string | null
          id?: string
          index_name: string
          status?: string
          updated_at?: string
          vector_key: string
        }
        Update: {
          chunk_id?: string
          content_hash?: string
          created_at?: string
          dimension?: number
          embedding_model?: string
          embedding_version?: string
          error?: string | null
          id?: string
          index_name?: string
          status?: string
          updated_at?: string
          vector_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunk_embeddings_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_text: string | null
          created_at: string | null
          deleted_at: string | null
          document_id: string | null
          id: string
          is_active: boolean | null
          note_id: string | null
          selection_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          context_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          document_id?: string | null
          id?: string
          is_active?: boolean | null
          note_id?: string | null
          selection_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          context_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          document_id?: string | null
          id?: string
          is_active?: boolean | null
          note_id?: string | null
          selection_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_usage: {
        Row: {
          contract_analyses_count: number | null
          created_at: string | null
          explanations_count: number | null
          handwriting_ocr_count: number | null
          id: string
          semantic_searches_count: number | null
          solution_checks_count: number | null
          updated_at: string | null
          usage_date: string
          user_id: string
          workspace_organization_count: number | null
        }
        Insert: {
          contract_analyses_count?: number | null
          created_at?: string | null
          explanations_count?: number | null
          handwriting_ocr_count?: number | null
          id?: string
          semantic_searches_count?: number | null
          solution_checks_count?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id: string
          workspace_organization_count?: number | null
        }
        Update: {
          contract_analyses_count?: number | null
          created_at?: string | null
          explanations_count?: number | null
          handwriting_ocr_count?: number | null
          id?: string
          semantic_searches_count?: number | null
          solution_checks_count?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id?: string
          workspace_organization_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_locality_regions: {
        Row: {
          city: string
          compliance: Json
          country_code: string
          created_at: string
          display_order: number
          is_active: boolean
          lat: number
          lng: number
          provider: string
          region_code: string
          updated_at: string
        }
        Insert: {
          city: string
          compliance?: Json
          country_code: string
          created_at?: string
          display_order?: number
          is_active?: boolean
          lat: number
          lng: number
          provider?: string
          region_code: string
          updated_at?: string
        }
        Update: {
          city?: string
          compliance?: Json
          country_code?: string
          created_at?: string
          display_order?: number
          is_active?: boolean
          lat?: number
          lng?: number
          provider?: string
          region_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          bounding_box: Json | null
          chunk_index: number | null
          chunk_type: string
          content_hash: string | null
          content_latex: string | null
          content_text: string
          created_at: string
          detected_concepts: string[] | null
          document_id: string
          embedding: string | null
          end_char: number | null
          id: string
          language: string | null
          metadata_json: Json
          page_id: string | null
          page_number: number
          start_char: number | null
          toc_id: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          bounding_box?: Json | null
          chunk_index?: number | null
          chunk_type: string
          content_hash?: string | null
          content_latex?: string | null
          content_text: string
          created_at?: string
          detected_concepts?: string[] | null
          document_id: string
          embedding?: string | null
          end_char?: number | null
          id?: string
          language?: string | null
          metadata_json?: Json
          page_id?: string | null
          page_number: number
          start_char?: number | null
          toc_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          bounding_box?: Json | null
          chunk_index?: number | null
          chunk_type?: string
          content_hash?: string | null
          content_latex?: string | null
          content_text?: string
          created_at?: string
          detected_concepts?: string[] | null
          document_id?: string
          embedding?: string | null
          end_char?: number | null
          id?: string
          language?: string | null
          metadata_json?: Json
          page_id?: string | null
          page_number?: number
          start_char?: number | null
          toc_id?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "document_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_toc_id_fkey"
            columns: ["toc_id"]
            isOneToOne: false
            referencedRelation: "document_toc"
            referencedColumns: ["id"]
          },
        ]
      }
      document_pages: {
        Row: {
          created_at: string
          document_id: string
          embedding: string | null
          extracted_latex: string | null
          extracted_text: string | null
          id: string
          ocr_completed: boolean | null
          ocr_confidence: number | null
          ocr_required: boolean | null
          page_number: number
        }
        Insert: {
          created_at?: string
          document_id: string
          embedding?: string | null
          extracted_latex?: string | null
          extracted_text?: string | null
          id?: string
          ocr_completed?: boolean | null
          ocr_confidence?: number | null
          ocr_required?: boolean | null
          page_number: number
        }
        Update: {
          created_at?: string
          document_id?: string
          embedding?: string | null
          extracted_latex?: string | null
          extracted_text?: string | null
          id?: string
          ocr_completed?: boolean | null
          ocr_confidence?: number | null
          ocr_required?: boolean | null
          page_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_pages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          added_by: string | null
          added_by_ai: boolean | null
          confidence: number | null
          created_at: string
          document_id: string
          id: string
          tag_id: string
        }
        Insert: {
          added_by?: string | null
          added_by_ai?: boolean | null
          confidence?: number | null
          created_at?: string
          document_id: string
          id?: string
          tag_id: string
        }
        Update: {
          added_by?: string | null
          added_by_ai?: boolean | null
          confidence?: number | null
          created_at?: string
          document_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      document_toc: {
        Row: {
          created_at: string
          depth: number
          document_id: string
          end_page: number | null
          estimated_concepts: number | null
          full_path: string | null
          id: string
          order_index: number
          parent_id: string | null
          start_page: number | null
          title: string
        }
        Insert: {
          created_at?: string
          depth?: number
          document_id: string
          end_page?: number | null
          estimated_concepts?: number | null
          full_path?: string | null
          id?: string
          order_index: number
          parent_id?: string | null
          start_page?: number | null
          title: string
        }
        Update: {
          created_at?: string
          depth?: number
          document_id?: string
          end_page?: number | null
          estimated_concepts?: number | null
          full_path?: string | null
          id?: string
          order_index?: number
          parent_id?: string | null
          start_page?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_toc_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_toc_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_toc"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          author: string | null
          canonical_id: string | null
          content_fingerprint: string | null
          created_at: string
          deleted_at: string | null
          detected_level: string | null
          detected_subject: string | null
          document_tags: string[]
          document_type: string
          edition: string | null
          embedding_completed: boolean
          file_size_bytes: number | null
          folder_id: string | null
          has_text_layer: boolean | null
          id: string
          is_active: boolean
          isbn: string | null
          last_opened_at: string | null
          ocr_status: string | null
          original_filename: string | null
          page_count: number | null
          privacy_mode: boolean
          processing_status: string
          publisher: string | null
          source_integration_id: string | null
          source_metadata: Json | null
          source_type: string | null
          storage_bucket: string
          storage_path: string
          text_extraction_completed: boolean
          title: string
          toc_extraction_completed: boolean
          total_study_time_seconds: number
          updated_at: string
          user_id: string
          uses_shared_embeddings: boolean | null
          workspace_id: string | null
        }
        Insert: {
          author?: string | null
          canonical_id?: string | null
          content_fingerprint?: string | null
          created_at?: string
          deleted_at?: string | null
          detected_level?: string | null
          detected_subject?: string | null
          document_tags?: string[]
          document_type?: string
          edition?: string | null
          embedding_completed?: boolean
          file_size_bytes?: number | null
          folder_id?: string | null
          has_text_layer?: boolean | null
          id?: string
          is_active?: boolean
          isbn?: string | null
          last_opened_at?: string | null
          ocr_status?: string | null
          original_filename?: string | null
          page_count?: number | null
          privacy_mode?: boolean
          processing_status?: string
          publisher?: string | null
          source_integration_id?: string | null
          source_metadata?: Json | null
          source_type?: string | null
          storage_bucket?: string
          storage_path: string
          text_extraction_completed?: boolean
          title: string
          toc_extraction_completed?: boolean
          total_study_time_seconds?: number
          updated_at?: string
          user_id: string
          uses_shared_embeddings?: boolean | null
          workspace_id?: string | null
        }
        Update: {
          author?: string | null
          canonical_id?: string | null
          content_fingerprint?: string | null
          created_at?: string
          deleted_at?: string | null
          detected_level?: string | null
          detected_subject?: string | null
          document_tags?: string[]
          document_type?: string
          edition?: string | null
          embedding_completed?: boolean
          file_size_bytes?: number | null
          folder_id?: string | null
          has_text_layer?: boolean | null
          id?: string
          is_active?: boolean
          isbn?: string | null
          last_opened_at?: string | null
          ocr_status?: string | null
          original_filename?: string | null
          page_count?: number | null
          privacy_mode?: boolean
          processing_status?: string
          publisher?: string | null
          source_integration_id?: string | null
          source_metadata?: Json | null
          source_type?: string | null
          storage_bucket?: string
          storage_path?: string
          text_extraction_completed?: boolean
          title?: string
          toc_extraction_completed?: boolean
          total_study_time_seconds?: number
          updated_at?: string
          user_id?: string
          uses_shared_embeddings?: boolean | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "canonical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "workspace_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_source_integration_fk"
            columns: ["source_integration_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_configs: {
        Row: {
          active_index_name: string
          active_model: string
          active_version: string
          created_at: string
          id: string
          scope: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          active_index_name: string
          active_model: string
          active_version: string
          created_at?: string
          id?: string
          scope: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          active_index_name?: string
          active_model?: string
          active_version?: string
          created_at?: string
          id?: string
          scope?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embedding_configs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_queue: {
        Row: {
          attempts: number | null
          canonical_match_id: string | null
          check_canonical: boolean | null
          completed_at: string | null
          created_at: string
          document_id: string
          error_message: string | null
          id: string
          priority: number | null
          processed_chunks: number | null
          started_at: string | null
          status: string
          total_chunks: number | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          attempts?: number | null
          canonical_match_id?: string | null
          check_canonical?: boolean | null
          completed_at?: string | null
          created_at?: string
          document_id: string
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_chunks?: number | null
          started_at?: string | null
          status?: string
          total_chunks?: number | null
          user_id: string
          workspace_id: string
        }
        Update: {
          attempts?: number | null
          canonical_match_id?: string | null
          check_canonical?: boolean | null
          completed_at?: string | null
          created_at?: string
          document_id?: string
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_chunks?: number | null
          started_at?: string | null
          status?: string
          total_chunks?: number | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_queue_canonical_match_id_fkey"
            columns: ["canonical_match_id"]
            isOneToOne: false
            referencedRelation: "canonical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_queue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_inquiries: {
        Row: {
          company: string | null
          company_size: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          aliases: string[] | null
          created_at: string
          deleted_at: string | null
          entity_type: string
          id: string
          metadata: Json | null
          name: string
          normalized_name: string | null
          plugin_family: string | null
          workspace_id: string | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string
          deleted_at?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          name: string
          normalized_name?: string | null
          plugin_family?: string | null
          workspace_id?: string | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string
          deleted_at?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          name?: string
          normalized_name?: string | null
          plugin_family?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_mentions: {
        Row: {
          chunk_id: string | null
          confidence: number | null
          created_at: string
          document_id: string
          entity_id: string
          id: string
          page_number: number | null
          selection_id: string | null
          source_action_id: string | null
          span_end: number | null
          span_start: number | null
        }
        Insert: {
          chunk_id?: string | null
          confidence?: number | null
          created_at?: string
          document_id: string
          entity_id: string
          id?: string
          page_number?: number | null
          selection_id?: string | null
          source_action_id?: string | null
          span_end?: number | null
          span_start?: number | null
        }
        Update: {
          chunk_id?: string | null
          confidence?: number | null
          created_at?: string
          document_id?: string
          entity_id?: string
          id?: string
          page_number?: number | null
          selection_id?: string | null
          source_action_id?: string | null
          span_end?: number | null
          span_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_mentions_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mentions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mentions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mentions_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mentions_source_action_fk"
            columns: ["source_action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_companies: {
        Row: {
          country_code: string | null
          created_at: string
          currency: string | null
          display_name: string
          exchange: string | null
          id: string
          industry: string | null
          isin: string | null
          legal_name: string
          lei: string | null
          metadata_json: Json
          org_id: string | null
          owner_id: string
          sector: string | null
          source_authority_json: Json
          status: string
          ticker: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          currency?: string | null
          display_name: string
          exchange?: string | null
          id?: string
          industry?: string | null
          isin?: string | null
          legal_name: string
          lei?: string | null
          metadata_json?: Json
          org_id?: string | null
          owner_id: string
          sector?: string | null
          source_authority_json?: Json
          status?: string
          ticker?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string
          exchange?: string | null
          id?: string
          industry?: string | null
          isin?: string | null
          legal_name?: string
          lei?: string | null
          metadata_json?: Json
          org_id?: string | null
          owner_id?: string
          sector?: string | null
          source_authority_json?: Json
          status?: string
          ticker?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equity_companies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equity_companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      explanations: {
        Row: {
          action_type: string | null
          book_anchor_page: number | null
          book_anchor_section: string | null
          completion_tokens: number | null
          context_chunks: string[] | null
          conversation_id: string | null
          created_at: string
          document_id: string | null
          estimated_cost_cents: number | null
          follow_up_requested: boolean | null
          id: string
          input_latex: string | null
          input_text: string
          latency_ms: number | null
          model_used: string | null
          plugin_family: string | null
          prompt_tokens: number | null
          related_chunk_ids: string[] | null
          request_type: string
          response_html: string | null
          response_latex: string | null
          response_text: string
          role: string | null
          selection_id: string | null
          user_feedback: string | null
          user_id: string
          user_level: string | null
          user_rating: number | null
          was_helpful: boolean | null
        }
        Insert: {
          action_type?: string | null
          book_anchor_page?: number | null
          book_anchor_section?: string | null
          completion_tokens?: number | null
          context_chunks?: string[] | null
          conversation_id?: string | null
          created_at?: string
          document_id?: string | null
          estimated_cost_cents?: number | null
          follow_up_requested?: boolean | null
          id?: string
          input_latex?: string | null
          input_text: string
          latency_ms?: number | null
          model_used?: string | null
          plugin_family?: string | null
          prompt_tokens?: number | null
          related_chunk_ids?: string[] | null
          request_type: string
          response_html?: string | null
          response_latex?: string | null
          response_text: string
          role?: string | null
          selection_id?: string | null
          user_feedback?: string | null
          user_id: string
          user_level?: string | null
          user_rating?: number | null
          was_helpful?: boolean | null
        }
        Update: {
          action_type?: string | null
          book_anchor_page?: number | null
          book_anchor_section?: string | null
          completion_tokens?: number | null
          context_chunks?: string[] | null
          conversation_id?: string | null
          created_at?: string
          document_id?: string | null
          estimated_cost_cents?: number | null
          follow_up_requested?: boolean | null
          id?: string
          input_latex?: string | null
          input_text?: string
          latency_ms?: number | null
          model_used?: string | null
          plugin_family?: string | null
          prompt_tokens?: number | null
          related_chunk_ids?: string[] | null
          request_type?: string
          response_html?: string | null
          response_latex?: string | null
          response_text?: string
          role?: string | null
          selection_id?: string | null
          user_feedback?: string | null
          user_id?: string
          user_level?: string | null
          user_rating?: number | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "explanations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explanations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explanations_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explanations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          document_id: string | null
          error: string | null
          extraction_type: string
          id: string
          input_config: Json | null
          model: string
          output_summary: Json | null
          prompt_version: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          document_id?: string | null
          error?: string | null
          extraction_type: string
          id?: string
          input_config?: Json | null
          model: string
          output_summary?: Json | null
          prompt_version: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          document_id?: string | null
          error?: string | null
          extraction_type?: string
          id?: string
          input_config?: Json | null
          model?: string
          output_summary?: Json | null
          prompt_version?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_runs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_invoice_line_items: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          document_id: string | null
          id: string
          invoice_number: string | null
          line_index: number | null
          quantity: number | null
          total: number | null
          unit_price: number | null
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          invoice_number?: string | null
          line_index?: number | null
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          invoice_number?: string | null
          line_index?: number | null
          quantity?: number | null
          total?: number | null
          unit_price?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_invoice_line_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_invoice_line_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_kpi_snapshots: {
        Row: {
          created_at: string
          id: string
          metrics: Json | null
          period_end: string | null
          period_start: string | null
          source_document_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          source_document_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          source_document_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_kpi_snapshots_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_kpi_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          icon: string | null
          id: string
          name: string
          org_id: string | null
          owner_id: string
          parent_id: string | null
          sort_index: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          name: string
          org_id?: string | null
          owner_id: string
          parent_id?: string | null
          sort_index?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          org_id?: string | null
          owner_id?: string
          parent_id?: string | null
          sort_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_usage: {
        Row: {
          created_at: string
          document_ingestions_count: number
          hour_start: string
          ocr_pages_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_ingestions_count?: number
          hour_start: string
          ocr_pages_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_ingestions_count?: number
          hour_start?: string
          ocr_pages_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hourly_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_events: {
        Row: {
          created_at: string
          document_id: string | null
          error_message: string | null
          id: string
          integration_account_id: string | null
          raw_metadata: Json | null
          source_type: string
          status: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          integration_account_id?: string | null
          raw_metadata?: Json | null
          source_type: string
          status?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          integration_account_id?: string | null
          raw_metadata?: Json | null
          source_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_events_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ink_recognition_attempts: {
        Row: {
          attempt_type: string | null
          confidence: number | null
          feedback_text: string | null
          feedback_type: string | null
          id: string
          metadata_json: Json
          note_id: string | null
          recognized_latex: string | null
          recognized_text: string | null
          step_number: number | null
          submitted_at: string
          user_id: string
          verification_details: Json | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          attempt_type?: string | null
          confidence?: number | null
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          metadata_json?: Json
          note_id?: string | null
          recognized_latex?: string | null
          recognized_text?: string | null
          step_number?: number | null
          submitted_at?: string
          user_id: string
          verification_details?: Json | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          attempt_type?: string | null
          confidence?: number | null
          feedback_text?: string | null
          feedback_type?: string | null
          id?: string
          metadata_json?: Json
          note_id?: string | null
          recognized_latex?: string | null
          recognized_text?: string | null
          step_number?: number | null
          submitted_at?: string
          user_id?: string
          verification_details?: Json | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          chunk_id: string | null
          confidence: number | null
          created_at: string
          currency: string | null
          deleted_at: string | null
          document_id: string | null
          due_at: string | null
          id: string
          is_verified: boolean | null
          kind: string
          number_value: number | null
          payload: Json
          run_id: string | null
          source_refs: Json | null
          text_value: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          workspace_id: string
        }
        Insert: {
          chunk_id?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          document_id?: string | null
          due_at?: string | null
          id?: string
          is_verified?: boolean | null
          kind: string
          number_value?: number | null
          payload?: Json
          run_id?: string | null
          source_refs?: Json | null
          text_value?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          workspace_id: string
        }
        Update: {
          chunk_id?: string | null
          confidence?: number | null
          created_at?: string
          currency?: string | null
          deleted_at?: string | null
          document_id?: string | null
          due_at?: string | null
          id?: string
          is_verified?: boolean | null
          kind?: string
          number_value?: number | null
          payload?: Json
          run_id?: string | null
          source_refs?: Json | null
          text_value?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "extraction_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_accounts: {
        Row: {
          access_token: string | null
          access_token_ref: string | null
          connected_at: string
          created_at: string
          display_name: string | null
          external_id: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          provider: string
          provider_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          access_token_ref?: string | null
          connected_at?: string
          created_at?: string
          display_name?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          provider?: string
          provider_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          access_token_ref?: string | null
          connected_at?: string
          created_at?: string
          display_name?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          provider?: string
          provider_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_accounts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_messages: {
        Row: {
          id: string
          integration_account_id: string
          message_type: string
          payload: Json
          resource_id: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          integration_account_id: string
          message_type: string
          payload: Json
          resource_id?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          integration_account_id?: string
          message_type?: string
          payload?: Json
          resource_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_messages_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_messages_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "integration_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      integration_resources: {
        Row: {
          created_at: string
          external_id: string
          id: string
          integration_account_id: string
          metadata: Json | null
          name: string | null
          resource_type: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          integration_account_id: string
          metadata?: Json | null
          name?: string | null
          resource_type: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          integration_account_id?: string
          metadata?: Json | null
          name?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_resources_integration_account_id_fkey"
            columns: ["integration_account_id"]
            isOneToOne: false
            referencedRelation: "integration_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      land_rights_checklists: {
        Row: {
          activation_opportunity_id: string | null
          checklist_json: Json
          created_at: string
          id: string
          installation_right_status: string
          permit_path_status: string
          removal_right_status: string
          revenue_share_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          rfq_id: string | null
          sublease_right_status: string
          updated_at: string
          utilities_access_status: string
          workspace_id: string
        }
        Insert: {
          activation_opportunity_id?: string | null
          checklist_json?: Json
          created_at?: string
          id?: string
          installation_right_status?: string
          permit_path_status?: string
          removal_right_status?: string
          revenue_share_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rfq_id?: string | null
          sublease_right_status?: string
          updated_at?: string
          utilities_access_status?: string
          workspace_id: string
        }
        Update: {
          activation_opportunity_id?: string | null
          checklist_json?: Json
          created_at?: string
          id?: string
          installation_right_status?: string
          permit_path_status?: string
          removal_right_status?: string
          revenue_share_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rfq_id?: string | null
          sublease_right_status?: string
          updated_at?: string
          utilities_access_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "land_rights_checklists_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_conversion_state"
            referencedColumns: ["activation_opportunity_id"]
          },
          {
            foreignKeyName: "land_rights_checklists_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_rights_checklists_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_request_queue"
            referencedColumns: ["activation_opportunity_id"]
          },
          {
            foreignKeyName: "land_rights_checklists_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_rights_checklists_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_rights_checklists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mandate_id: string | null
          match_kind: string
          next_action_json: Json
          option_id: string | null
          partner_id: string | null
          rationale_json: Json
          rfq_id: string | null
          score: number | null
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mandate_id?: string | null
          match_kind?: string
          next_action_json?: Json
          option_id?: string | null
          partner_id?: string | null
          rationale_json?: Json
          rfq_id?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mandate_id?: string | null
          match_kind?: string
          next_action_json?: Json
          option_id?: string | null
          partner_id?: string | null
          rationale_json?: Json
          rfq_id?: string | null
          score?: number | null
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "sourced_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mathpix_pdf_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          document_id: string
          error_message: string | null
          id: string
          lines_json_storage_path: string | null
          mathpix_pdf_id: string
          mmd_storage_path: string | null
          page_count: number | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          document_id: string
          error_message?: string | null
          id?: string
          lines_json_storage_path?: string | null
          mathpix_pdf_id: string
          mmd_storage_path?: string | null
          page_count?: number | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          document_id?: string
          error_message?: string | null
          id?: string
          lines_json_storage_path?: string | null
          mathpix_pdf_id?: string
          mmd_storage_path?: string | null
          page_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mathpix_pdf_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_actions: {
        Row: {
          action_type: string | null
          created_at: string
          id: string
          meeting_id: string
          summary: string
          task_id: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          summary: string
          task_id?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          summary?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_actions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          participants: Json | null
          source_document_id: string | null
          starts_at: string | null
          title: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          participants?: Json | null
          source_document_id?: string | null
          starts_at?: string | null
          title: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          participants?: Json | null
          source_document_id?: string | null
          starts_at?: string | null
          title?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      modular_quote_terms: {
        Row: {
          activation_opportunity_id: string | null
          created_at: string
          created_by: string | null
          delivery_timeline: string | null
          drawings_refs_json: Json
          id: string
          install_cost: number | null
          maintenance_sla_json: Json
          monthly_lease_amount: number | null
          partner_id: string | null
          prefab_model_id: string | null
          removal_cost: number | null
          rfq_id: string | null
          sale_amount: number | null
          status: string
          terms_json: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activation_opportunity_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_timeline?: string | null
          drawings_refs_json?: Json
          id?: string
          install_cost?: number | null
          maintenance_sla_json?: Json
          monthly_lease_amount?: number | null
          partner_id?: string | null
          prefab_model_id?: string | null
          removal_cost?: number | null
          rfq_id?: string | null
          sale_amount?: number | null
          status?: string
          terms_json?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activation_opportunity_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_timeline?: string | null
          drawings_refs_json?: Json
          id?: string
          install_cost?: number | null
          maintenance_sla_json?: Json
          monthly_lease_amount?: number | null
          partner_id?: string | null
          prefab_model_id?: string | null
          removal_cost?: number | null
          rfq_id?: string | null
          sale_amount?: number | null
          status?: string
          terms_json?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modular_quote_terms_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_conversion_state"
            referencedColumns: ["activation_opportunity_id"]
          },
          {
            foreignKeyName: "modular_quote_terms_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modular_quote_terms_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_request_queue"
            referencedColumns: ["activation_opportunity_id"]
          },
          {
            foreignKeyName: "modular_quote_terms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modular_quote_terms_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modular_quote_terms_prefab_model_id_fkey"
            columns: ["prefab_model_id"]
            isOneToOne: false
            referencedRelation: "prefab_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modular_quote_terms_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modular_quote_terms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      note_assets: {
        Row: {
          asset_type: string
          cell_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          note_id: string
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          asset_type: string
          cell_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          note_id: string
          storage_bucket: string
          storage_path: string
        }
        Update: {
          asset_type?: string
          cell_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          note_id?: string
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_assets_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "note_cells"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_assets_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_cells: {
        Row: {
          blocks: Json
          cell_type: string
          created_at: string
          id: string
          is_pinned: boolean | null
          message_role: string | null
          note_id: string
          position: number
          updated_at: string
        }
        Insert: {
          blocks?: Json
          cell_type?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          message_role?: string | null
          note_id: string
          position: number
          updated_at?: string
        }
        Update: {
          blocks?: Json
          cell_type?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          message_role?: string | null
          note_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_cells_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          anchor_position: Json | null
          color: string | null
          completed_at: string | null
          correct_steps: number | null
          created_at: string
          deleted_at: string | null
          document_id: string | null
          expected_answer_latex: string | null
          expected_answer_text: string | null
          hints_used: number | null
          id: string
          ink_data: Json | null
          ink_data_url: string | null
          is_pinned: boolean
          note_latex: string | null
          note_text: string | null
          note_type: string | null
          page_number: number | null
          problem_latex: string | null
          problem_text: string | null
          problem_type: string | null
          recognized_latex: string | null
          selection_id: string | null
          solution_revealed: boolean | null
          source_explanation_id: string | null
          started_at: string | null
          tags: string[] | null
          total_steps: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
          workspace_id: string | null
        }
        Insert: {
          anchor_position?: Json | null
          color?: string | null
          completed_at?: string | null
          correct_steps?: number | null
          created_at?: string
          deleted_at?: string | null
          document_id?: string | null
          expected_answer_latex?: string | null
          expected_answer_text?: string | null
          hints_used?: number | null
          id?: string
          ink_data?: Json | null
          ink_data_url?: string | null
          is_pinned?: boolean
          note_latex?: string | null
          note_text?: string | null
          note_type?: string | null
          page_number?: number | null
          problem_latex?: string | null
          problem_text?: string | null
          problem_type?: string | null
          recognized_latex?: string | null
          selection_id?: string | null
          solution_revealed?: boolean | null
          source_explanation_id?: string | null
          started_at?: string | null
          tags?: string[] | null
          total_steps?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          workspace_id?: string | null
        }
        Update: {
          anchor_position?: Json | null
          color?: string | null
          completed_at?: string | null
          correct_steps?: number | null
          created_at?: string
          deleted_at?: string | null
          document_id?: string | null
          expected_answer_latex?: string | null
          expected_answer_text?: string | null
          hints_used?: number | null
          id?: string
          ink_data?: Json | null
          ink_data_url?: string | null
          is_pinned?: boolean
          note_latex?: string | null
          note_text?: string | null
          note_type?: string | null
          page_number?: number | null
          problem_latex?: string | null
          problem_text?: string | null
          problem_type?: string | null
          recognized_latex?: string | null
          selection_id?: string | null
          solution_revealed?: boolean | null
          source_explanation_id?: string | null
          started_at?: string | null
          tags?: string[] | null
          total_steps?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_selection_id_fkey"
            columns: ["selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_source_explanation_id_fkey"
            columns: ["source_explanation_id"]
            isOneToOne: false
            referencedRelation: "explanations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_underwriting_checklists: {
        Row: {
          activation_opportunity_id: string | null
          approval_status: string
          checklist_json: Json
          coverage_ratio: number | null
          created_at: string
          hard_stops_json: Json
          id: string
          reserve_months: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          rfq_id: string | null
          route_decision: string
          tenant_commitment_status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activation_opportunity_id?: string | null
          approval_status?: string
          checklist_json?: Json
          coverage_ratio?: number | null
          created_at?: string
          hard_stops_json?: Json
          id?: string
          reserve_months?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rfq_id?: string | null
          route_decision?: string
          tenant_commitment_status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activation_opportunity_id?: string | null
          approval_status?: string
          checklist_json?: Json
          coverage_ratio?: number | null
          created_at?: string
          hard_stops_json?: Json
          id?: string
          reserve_months?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rfq_id?: string | null
          route_decision?: string
          tenant_commitment_status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_underwriting_checklists_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_conversion_state"
            referencedColumns: ["activation_opportunity_id"]
          },
          {
            foreignKeyName: "operator_underwriting_checklists_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_underwriting_checklists_activation_opportunity_id_fkey"
            columns: ["activation_opportunity_id"]
            isOneToOne: false
            referencedRelation: "activation_request_queue"
            referencedColumns: ["activation_opportunity_id"]
          },
          {
            foreignKeyName: "operator_underwriting_checklists_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_underwriting_checklists_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_underwriting_checklists_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      option_sources: {
        Row: {
          captured_at: string
          id: string
          license_signal_json: Json
          limited_evidence_snapshot_json: Json
          metadata_json: Json
          option_id: string
          permit_signal_json: Json
          source_fingerprint: string | null
          source_name: string
          source_run_id: string | null
          source_url: string | null
          terms_posture: string
          workspace_id: string | null
        }
        Insert: {
          captured_at?: string
          id?: string
          license_signal_json?: Json
          limited_evidence_snapshot_json?: Json
          metadata_json?: Json
          option_id: string
          permit_signal_json?: Json
          source_fingerprint?: string | null
          source_name: string
          source_run_id?: string | null
          source_url?: string | null
          terms_posture?: string
          workspace_id?: string | null
        }
        Update: {
          captured_at?: string
          id?: string
          license_signal_json?: Json
          limited_evidence_snapshot_json?: Json
          metadata_json?: Json
          option_id?: string
          permit_signal_json?: Json
          source_fingerprint?: string | null
          source_name?: string
          source_run_id?: string | null
          source_url?: string | null
          terms_posture?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "option_sources_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "sourced_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_sources_source_run_id_fkey"
            columns: ["source_run_id"]
            isOneToOne: false
            referencedRelation: "source_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      org_data_locality_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          job_payload: Json
          org_id: string
          progress: number
          region_code: string
          requested_by: string
          result: Json
          started_at: string | null
          status: string
          step: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          job_payload?: Json
          org_id: string
          progress?: number
          region_code: string
          requested_by: string
          result?: Json
          started_at?: string | null
          status: string
          step: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          job_payload?: Json
          org_id?: string
          progress?: number
          region_code?: string
          requested_by?: string
          result?: Json
          started_at?: string | null
          status?: string
          step?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_data_locality_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_data_locality_runs_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "data_locality_regions"
            referencedColumns: ["region_code"]
          },
          {
            foreignKeyName: "org_data_locality_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string
          org_id: string
          revoked_at: string | null
          revoked_by: string | null
          role: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          email: string
          expires_at: string
          id?: string
          invited_at?: string
          invited_by: string
          org_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string
          org_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_at: string | null
          joined_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          joined_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          joined_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string
          data_locality_documents_bucket_uri: string | null
          data_locality_enabled: boolean
          data_locality_exports_bucket_uri: string | null
          data_locality_kms_key_resource: string | null
          data_locality_region: string | null
          id: string
          is_active: boolean
          multi_user_enabled: boolean
          name: string
          owner_id: string
          plan_tier: string
          slug: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          data_locality_documents_bucket_uri?: string | null
          data_locality_enabled?: boolean
          data_locality_exports_bucket_uri?: string | null
          data_locality_kms_key_resource?: string | null
          data_locality_region?: string | null
          id?: string
          is_active?: boolean
          multi_user_enabled?: boolean
          name: string
          owner_id: string
          plan_tier?: string
          slug?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          data_locality_documents_bucket_uri?: string | null
          data_locality_enabled?: boolean
          data_locality_exports_bucket_uri?: string | null
          data_locality_kms_key_resource?: string | null
          data_locality_region?: string | null
          id?: string
          is_active?: boolean
          multi_user_enabled?: boolean
          name?: string
          owner_id?: string
          plan_tier?: string
          slug?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_data_locality_region_fkey"
            columns: ["data_locality_region"]
            isOneToOne: false
            referencedRelation: "data_locality_regions"
            referencedColumns: ["region_code"]
          },
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_events: {
        Row: {
          buyer_profile_id: string | null
          created_at: string
          event_type: string
          id: string
          match_id: string | null
          metadata_json: Json
          occurred_at: string
          outcome: string | null
          partner_id: string
          recorded_by: string | null
          response_latency_seconds: number | null
          rfq_id: string | null
          workspace_id: string | null
        }
        Insert: {
          buyer_profile_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          match_id?: string | null
          metadata_json?: Json
          occurred_at?: string
          outcome?: string | null
          partner_id: string
          recorded_by?: string | null
          response_latency_seconds?: number | null
          rfq_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          buyer_profile_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string | null
          metadata_json?: Json
          occurred_at?: string
          outcome?: string | null
          partner_id?: string
          recorded_by?: string | null
          response_latency_seconds?: number | null
          rfq_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_events_buyer_profile_id_fkey"
            columns: ["buyer_profile_id"]
            isOneToOne: false
            referencedRelation: "buyer_readiness_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_events_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_scorecards: {
        Row: {
          buyer_satisfaction_pts: number
          compliance_pts: number
          composite_score: number
          computed_at: string
          conversion_pts: number
          inputs_json: Json
          match_quality_pts: number
          partner_id: string
          response_speed_pts: number
          updated_at: string
        }
        Insert: {
          buyer_satisfaction_pts?: number
          compliance_pts?: number
          composite_score?: number
          computed_at?: string
          conversion_pts?: number
          inputs_json?: Json
          match_quality_pts?: number
          partner_id: string
          response_speed_pts?: number
          updated_at?: string
        }
        Update: {
          buyer_satisfaction_pts?: number
          compliance_pts?: number
          composite_score?: number
          computed_at?: string
          conversion_pts?: number
          inputs_json?: Json
          match_quality_pts?: number
          partner_id?: string
          response_speed_pts?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_scorecards_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          city: string | null
          commercial_terms_json: Json
          contact_json: Json
          country_code: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          languages: string[]
          legal_name: string | null
          licensing_json: Json
          metadata_json: Json
          notes: string | null
          organization_id: string | null
          partner_kind: string
          privacy_agreement_signed_at: string | null
          response_sla_minutes: number | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          commercial_terms_json?: Json
          contact_json?: Json
          country_code?: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          languages?: string[]
          legal_name?: string | null
          licensing_json?: Json
          metadata_json?: Json
          notes?: string | null
          organization_id?: string | null
          partner_kind: string
          privacy_agreement_signed_at?: string | null
          response_sla_minutes?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          commercial_terms_json?: Json
          contact_json?: Json
          country_code?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          languages?: string[]
          legal_name?: string | null
          licensing_json?: Json
          metadata_json?: Json
          notes?: string | null
          organization_id?: string | null
          partner_kind?: string
          privacy_agreement_signed_at?: string | null
          response_sla_minutes?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_expiry_month: number | null
          card_expiry_year: number | null
          card_holder_name: string | null
          card_last_four: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          moyasar_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_expiry_month?: number | null
          card_expiry_year?: number | null
          card_holder_name?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          moyasar_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_expiry_month?: number | null
          card_expiry_year?: number | null
          card_holder_name?: string | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          moyasar_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_lines: {
        Row: {
          confidence: number | null
          content_latex: string | null
          content_text: string | null
          created_at: string
          document_id: string
          id: string
          line_index: number
          line_type: string | null
          page_number: number
          x_max: number
          x_min: number
          y_max: number
          y_min: number
        }
        Insert: {
          confidence?: number | null
          content_latex?: string | null
          content_text?: string | null
          created_at?: string
          document_id: string
          id?: string
          line_index: number
          line_type?: string | null
          page_number: number
          x_max: number
          x_min: number
          y_max: number
          y_min: number
        }
        Update: {
          confidence?: number | null
          content_latex?: string | null
          content_text?: string | null
          created_at?: string
          document_id?: string
          id?: string
          line_index?: number
          line_type?: string | null
          page_number?: number
          x_max?: number
          x_min?: number
          y_max?: number
          y_min?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdf_lines_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_drafts: {
        Row: {
          created_at: string
          id: string
          playbook_id: string
          spec_json: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          playbook_id: string
          spec_json: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          playbook_id?: string
          spec_json?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_drafts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_families: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      plugin_subscriptions: {
        Row: {
          billing_metadata: Json | null
          created_at: string
          expires_at: string | null
          id: string
          org_id: string | null
          plan: string
          plugin_family_id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          billing_metadata?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id?: string | null
          plan?: string
          plugin_family_id: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          billing_metadata?: Json | null
          created_at?: string
          expires_at?: string | null
          id?: string
          org_id?: string | null
          plan?: string
          plugin_family_id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_subscriptions_plugin_family_id_fkey"
            columns: ["plugin_family_id"]
            isOneToOne: false
            referencedRelation: "plugin_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plugin_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prefab_models: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          delivery_regions_json: Json
          excluded_scope_json: Json
          id: string
          included_scope_json: Json
          material_spec_summary: string | null
          media_refs_json: Json
          model_name: string
          model_type: string | null
          partner_id: string
          price_range_json: Json
          size_sqm: number | null
          status: string
          updated_at: string
          use_case: string | null
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          delivery_regions_json?: Json
          excluded_scope_json?: Json
          id?: string
          included_scope_json?: Json
          material_spec_summary?: string | null
          media_refs_json?: Json
          model_name: string
          model_type?: string | null
          partner_id: string
          price_range_json?: Json
          size_sqm?: number | null
          status?: string
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          delivery_regions_json?: Json
          excluded_scope_json?: Json
          id?: string
          included_scope_json?: Json
          material_spec_summary?: string | null
          media_refs_json?: Json
          model_name?: string
          model_type?: string | null
          partner_id?: string
          price_range_json?: Json
          size_sqm?: number | null
          status?: string
          updated_at?: string
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefab_models_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      prefab_supplier_profiles: {
        Row: {
          categories_json: Json
          company_identity_json: Json
          created_at: string
          factory_capacity_json: Json
          partner_id: string
          regions_served_json: Json
          sla_json: Json
          updated_at: string
          verification_state: string
          warranty_json: Json
        }
        Insert: {
          categories_json?: Json
          company_identity_json?: Json
          created_at?: string
          factory_capacity_json?: Json
          partner_id: string
          regions_served_json?: Json
          sla_json?: Json
          updated_at?: string
          verification_state?: string
          warranty_json?: Json
        }
        Update: {
          categories_json?: Json
          company_identity_json?: Json
          created_at?: string
          factory_capacity_json?: Json
          partner_id?: string
          regions_served_json?: Json
          sla_json?: Json
          updated_at?: string
          verification_state?: string
          warranty_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prefab_supplier_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak_days: number
          daily_ask_count: number
          daily_explanation_count: number
          daily_explanation_reset_at: string
          daily_rag_reset_at: string
          daily_search_count: number
          default_org_id: string | null
          display_name: string | null
          education_level: string | null
          email: string | null
          grace_period_ends_at: string | null
          graduation_year: number | null
          guest_claimed_at: string | null
          guest_link_version: number
          id: string
          institution: string | null
          is_guest: boolean
          last_active_at: string | null
          last_study_date: string | null
          latest_transaction_id: string | null
          longest_streak_days: number
          major: string | null
          moyasar_customer_id: string | null
          onboarding_completed_at: string | null
          onboarding_persona: string | null
          payment_source: string | null
          phone_number: string | null
          phone_verification_provider: string | null
          phone_verified_at: string | null
          preferred_explanation_depth: string | null
          preferred_hint_style: string | null
          show_latex_source: boolean | null
          storage_used_bytes: number | null
          stripe_customer_id: string | null
          subscription_auto_renew: boolean | null
          subscription_cancelled_at: string | null
          subscription_expires_at: string | null
          subscription_period: string | null
          subscription_status: string
          subscription_tier: string
          subscription_trial_consumed_at: string | null
          subscription_trial_started_at: string | null
          timezone: string | null
          total_explanations_lifetime: number
          total_xp: number
          updated_at: string
          user_type: string
          whatsapp_phone_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak_days?: number
          daily_ask_count?: number
          daily_explanation_count?: number
          daily_explanation_reset_at?: string
          daily_rag_reset_at?: string
          daily_search_count?: number
          default_org_id?: string | null
          display_name?: string | null
          education_level?: string | null
          email?: string | null
          grace_period_ends_at?: string | null
          graduation_year?: number | null
          guest_claimed_at?: string | null
          guest_link_version?: number
          id: string
          institution?: string | null
          is_guest?: boolean
          last_active_at?: string | null
          last_study_date?: string | null
          latest_transaction_id?: string | null
          longest_streak_days?: number
          major?: string | null
          moyasar_customer_id?: string | null
          onboarding_completed_at?: string | null
          onboarding_persona?: string | null
          payment_source?: string | null
          phone_number?: string | null
          phone_verification_provider?: string | null
          phone_verified_at?: string | null
          preferred_explanation_depth?: string | null
          preferred_hint_style?: string | null
          show_latex_source?: boolean | null
          storage_used_bytes?: number | null
          stripe_customer_id?: string | null
          subscription_auto_renew?: boolean | null
          subscription_cancelled_at?: string | null
          subscription_expires_at?: string | null
          subscription_period?: string | null
          subscription_status?: string
          subscription_tier?: string
          subscription_trial_consumed_at?: string | null
          subscription_trial_started_at?: string | null
          timezone?: string | null
          total_explanations_lifetime?: number
          total_xp?: number
          updated_at?: string
          user_type?: string
          whatsapp_phone_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak_days?: number
          daily_ask_count?: number
          daily_explanation_count?: number
          daily_explanation_reset_at?: string
          daily_rag_reset_at?: string
          daily_search_count?: number
          default_org_id?: string | null
          display_name?: string | null
          education_level?: string | null
          email?: string | null
          grace_period_ends_at?: string | null
          graduation_year?: number | null
          guest_claimed_at?: string | null
          guest_link_version?: number
          id?: string
          institution?: string | null
          is_guest?: boolean
          last_active_at?: string | null
          last_study_date?: string | null
          latest_transaction_id?: string | null
          longest_streak_days?: number
          major?: string | null
          moyasar_customer_id?: string | null
          onboarding_completed_at?: string | null
          onboarding_persona?: string | null
          payment_source?: string | null
          phone_number?: string | null
          phone_verification_provider?: string | null
          phone_verified_at?: string | null
          preferred_explanation_depth?: string | null
          preferred_hint_style?: string | null
          show_latex_source?: boolean | null
          storage_used_bytes?: number | null
          stripe_customer_id?: string | null
          subscription_auto_renew?: boolean | null
          subscription_cancelled_at?: string | null
          subscription_expires_at?: string | null
          subscription_period?: string | null
          subscription_status?: string
          subscription_tier?: string
          subscription_trial_consumed_at?: string | null
          subscription_trial_started_at?: string | null
          timezone?: string | null
          total_explanations_lifetime?: number
          total_xp?: number
          updated_at?: string
          user_type?: string
          whatsapp_phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_org_id_fkey"
            columns: ["default_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_reward_applied: boolean
          referred_reward_type: string | null
          referrer_id: string
          referrer_reward_applied: boolean
          referrer_reward_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_reward_applied?: boolean
          referred_reward_type?: string | null
          referrer_id: string
          referrer_reward_applied?: boolean
          referrer_reward_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_reward_applied?: boolean
          referred_reward_type?: string | null
          referrer_id?: string
          referrer_reward_applied?: boolean
          referrer_reward_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_supplier_matches: {
        Row: {
          buyer_recommendation_json: Json
          created_at: string
          created_by: string | null
          id: string
          match_id: string | null
          partner_id: string
          prefab_model_id: string | null
          quote_status: string | null
          response_sla_at: string | null
          rfq_id: string
          status: string
          supplier_response_json: Json
          updated_at: string
        }
        Insert: {
          buyer_recommendation_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          match_id?: string | null
          partner_id: string
          prefab_model_id?: string | null
          quote_status?: string | null
          response_sla_at?: string | null
          rfq_id: string
          status?: string
          supplier_response_json?: Json
          updated_at?: string
        }
        Update: {
          buyer_recommendation_json?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          match_id?: string | null
          partner_id?: string
          prefab_model_id?: string | null
          quote_status?: string | null
          response_sla_at?: string | null
          rfq_id?: string
          status?: string
          supplier_response_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_supplier_matches_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_supplier_matches_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_supplier_matches_prefab_model_id_fkey"
            columns: ["prefab_model_id"]
            isOneToOne: false
            referencedRelation: "prefab_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_supplier_matches_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          activation_party_type: string | null
          activation_route: string | null
          activation_score_json: Json
          budget_range_json: Json
          buyer_entity_id: string | null
          city: string | null
          contact_preference: string | null
          country_code: string
          created_at: string
          created_by: string | null
          delivery_timeline: string | null
          document_refs_json: Json
          id: string
          land_status: string | null
          mandate_id: string | null
          metadata_json: Json
          prefab_category: string | null
          qualification_json: Json
          scope_needs_json: Json
          status: string
          target_size_json: Json
          title: string
          updated_at: string
          use_case: string | null
          vertical: string
          workspace_id: string
        }
        Insert: {
          activation_party_type?: string | null
          activation_route?: string | null
          activation_score_json?: Json
          budget_range_json?: Json
          buyer_entity_id?: string | null
          city?: string | null
          contact_preference?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          delivery_timeline?: string | null
          document_refs_json?: Json
          id?: string
          land_status?: string | null
          mandate_id?: string | null
          metadata_json?: Json
          prefab_category?: string | null
          qualification_json?: Json
          scope_needs_json?: Json
          status?: string
          target_size_json?: Json
          title: string
          updated_at?: string
          use_case?: string | null
          vertical?: string
          workspace_id: string
        }
        Update: {
          activation_party_type?: string | null
          activation_route?: string | null
          activation_score_json?: Json
          budget_range_json?: Json
          buyer_entity_id?: string | null
          city?: string | null
          contact_preference?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          delivery_timeline?: string | null
          document_refs_json?: Json
          id?: string
          land_status?: string | null
          mandate_id?: string | null
          metadata_json?: Json
          prefab_category?: string | null
          qualification_json?: Json
          scope_needs_json?: Json
          status?: string
          target_size_json?: Json
          title?: string
          updated_at?: string
          use_case?: string | null
          vertical?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_buyer_entity_id_fkey"
            columns: ["buyer_entity_id"]
            isOneToOne: false
            referencedRelation: "buyer_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      selections: {
        Row: {
          bounding_box: Json
          context_after: string | null
          context_before: string | null
          created_at: string
          deleted_at: string | null
          document_id: string
          explanation_id: string | null
          id: string
          page_id: string | null
          page_number: number
          parsed_intent: string | null
          selected_latex: string | null
          selected_text: string | null
          selection_type: string
          stroke_data: Json | null
          user_annotation: string | null
          user_id: string
        }
        Insert: {
          bounding_box: Json
          context_after?: string | null
          context_before?: string | null
          created_at?: string
          deleted_at?: string | null
          document_id: string
          explanation_id?: string | null
          id?: string
          page_id?: string | null
          page_number: number
          parsed_intent?: string | null
          selected_latex?: string | null
          selected_text?: string | null
          selection_type: string
          stroke_data?: Json | null
          user_annotation?: string | null
          user_id: string
        }
        Update: {
          bounding_box?: Json
          context_after?: string | null
          context_before?: string | null
          created_at?: string
          deleted_at?: string | null
          document_id?: string
          explanation_id?: string | null
          id?: string
          page_id?: string | null
          page_number?: number
          parsed_intent?: string | null
          selected_latex?: string | null
          selected_text?: string | null
          selection_type?: string
          stroke_data?: Json | null
          user_annotation?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "selections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "document_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sharing_grants: {
        Row: {
          allowed_action: string
          buyer_packet_id: string | null
          created_at: string
          document_id: string | null
          expires_at: string | null
          granted_by: string | null
          granted_to_identifier: string | null
          granted_to_kind: string
          id: string
          metadata_json: Json
          partner_id: string | null
          purpose: string
          revoked_at: string | null
          revoked_reason: string | null
          share_mode: string
          token_hash: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          allowed_action?: string
          buyer_packet_id?: string | null
          created_at?: string
          document_id?: string | null
          expires_at?: string | null
          granted_by?: string | null
          granted_to_identifier?: string | null
          granted_to_kind?: string
          id?: string
          metadata_json?: Json
          partner_id?: string | null
          purpose: string
          revoked_at?: string | null
          revoked_reason?: string | null
          share_mode?: string
          token_hash?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          allowed_action?: string
          buyer_packet_id?: string | null
          created_at?: string
          document_id?: string | null
          expires_at?: string | null
          granted_by?: string | null
          granted_to_identifier?: string | null
          granted_to_kind?: string
          id?: string
          metadata_json?: Json
          partner_id?: string | null
          purpose?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          share_mode?: string
          token_hash?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sharing_grants_buyer_packet_id_fkey"
            columns: ["buyer_packet_id"]
            isOneToOne: false
            referencedRelation: "buyer_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sharing_grants_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sharing_grants_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sharing_grants_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_campaigns: {
        Row: {
          campaign_kind: string
          content_refs_json: Json
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          metrics_json: Json
          package_id: string | null
          partner_id: string | null
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          campaign_kind?: string
          content_refs_json?: Json
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          metrics_json?: Json
          package_id?: string | null
          partner_id?: string | null
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          campaign_kind?: string
          content_refs_json?: Json
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          metrics_json?: Json
          package_id?: string | null
          partner_id?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_campaigns_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "supplier_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_campaigns_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      source_runs: {
        Row: {
          adapter_telemetry_json: Json
          completed_at: string | null
          created_at: string
          error_summary: string | null
          id: string
          limits_json: Json
          mandate_id: string | null
          query_text: string
          rfq_id: string | null
          sourced_option_count: number
          sources_json: Json
          started_at: string | null
          status: string
          trigger_kind: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          adapter_telemetry_json?: Json
          completed_at?: string | null
          created_at?: string
          error_summary?: string | null
          id?: string
          limits_json?: Json
          mandate_id?: string | null
          query_text?: string
          rfq_id?: string | null
          sourced_option_count?: number
          sources_json?: Json
          started_at?: string | null
          status?: string
          trigger_kind?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          adapter_telemetry_json?: Json
          completed_at?: string | null
          created_at?: string
          error_summary?: string | null
          id?: string
          limits_json?: Json
          mandate_id?: string | null
          query_text?: string
          rfq_id?: string | null
          sourced_option_count?: number
          sources_json?: Json
          started_at?: string | null
          status?: string
          trigger_kind?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_runs_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_runs_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sourced_options: {
        Row: {
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          country_code: string | null
          created_at: string
          district: string | null
          evidence_snapshot_json: Json
          id: string
          mandate_id: string | null
          model_payload_json: Json
          partner_id: string | null
          price_amount: number | null
          price_currency: string | null
          rfq_id: string | null
          score_json: Json
          source_fingerprint: string
          source_kind: string
          source_name: string | null
          source_run_id: string | null
          source_url: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          vertical: string
          workspace_id: string | null
        }
        Insert: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          district?: string | null
          evidence_snapshot_json?: Json
          id?: string
          mandate_id?: string | null
          model_payload_json?: Json
          partner_id?: string | null
          price_amount?: number | null
          price_currency?: string | null
          rfq_id?: string | null
          score_json?: Json
          source_fingerprint: string
          source_kind?: string
          source_name?: string | null
          source_run_id?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          vertical?: string
          workspace_id?: string | null
        }
        Update: {
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          district?: string | null
          evidence_snapshot_json?: Json
          id?: string
          mandate_id?: string | null
          model_payload_json?: Json
          partner_id?: string | null
          price_amount?: number | null
          price_currency?: string | null
          rfq_id?: string | null
          score_json?: Json
          source_fingerprint?: string
          source_kind?: string
          source_name?: string | null
          source_run_id?: string | null
          source_url?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          vertical?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourced_options_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourced_options_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourced_options_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourced_options_source_run_id_fkey"
            columns: ["source_run_id"]
            isOneToOne: false
            referencedRelation: "source_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourced_options_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
          stripe_customer_id: string | null
          stripe_event_id: string
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          stripe_customer_id?: string | null
          stripe_event_id: string
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
          stripe_customer_id?: string | null
          stripe_event_id?: string
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount_cents: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string
          failure_count: number | null
          failure_reason: string | null
          gateway_event_id: string | null
          id: string
          is_renewal: boolean | null
          metadata: Json | null
          moyasar_invoice_id: string | null
          moyasar_payment_id: string | null
          payment_method_id: string | null
          retry_at: string | null
          status: string
          subscription_period: string
          subscription_tier: string
          updated_at: string | null
          user_id: string
          verification_source: string | null
          verified_at: string | null
        }
        Insert: {
          amount_cents: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string
          failure_count?: number | null
          failure_reason?: string | null
          gateway_event_id?: string | null
          id?: string
          is_renewal?: boolean | null
          metadata?: Json | null
          moyasar_invoice_id?: string | null
          moyasar_payment_id?: string | null
          payment_method_id?: string | null
          retry_at?: string | null
          status?: string
          subscription_period: string
          subscription_tier: string
          updated_at?: string | null
          user_id: string
          verification_source?: string | null
          verified_at?: string | null
        }
        Update: {
          amount_cents?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string
          failure_count?: number | null
          failure_reason?: string | null
          gateway_event_id?: string | null
          id?: string
          is_renewal?: boolean | null
          metadata?: Json | null
          moyasar_invoice_id?: string | null
          moyasar_payment_id?: string | null
          payment_method_id?: string | null
          retry_at?: string | null
          status?: string
          subscription_period?: string
          subscription_tier?: string
          updated_at?: string | null
          user_id?: string
          verification_source?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          badge_text: string | null
          billing_model_version: string
          created_at: string
          description: string | null
          display_features: Json
          display_order: number
          features: Json
          guardrails: Json
          highlight_color: string | null
          id: string
          is_active: boolean
          is_default: boolean
          limits: Json
          meter_limits: Json
          name: string
          price_monthly_sar: number | null
          price_monthly_usd: number | null
          price_yearly_sar: number | null
          price_yearly_usd: number | null
          product_id_monthly: string | null
          product_id_yearly: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          billing_model_version?: string
          created_at?: string
          description?: string | null
          display_features?: Json
          display_order?: number
          features?: Json
          guardrails?: Json
          highlight_color?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          limits?: Json
          meter_limits?: Json
          name: string
          price_monthly_sar?: number | null
          price_monthly_usd?: number | null
          price_yearly_sar?: number | null
          price_yearly_usd?: number | null
          product_id_monthly?: string | null
          product_id_yearly?: string | null
          tier: string
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          billing_model_version?: string
          created_at?: string
          description?: string | null
          display_features?: Json
          display_order?: number
          features?: Json
          guardrails?: Json
          highlight_color?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          limits?: Json
          meter_limits?: Json
          name?: string
          price_monthly_sar?: number | null
          price_monthly_usd?: number | null
          price_yearly_sar?: number | null
          price_yearly_usd?: number | null
          product_id_monthly?: string | null
          product_id_yearly?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_packages: {
        Row: {
          benefits_json: Json
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          metadata_json: Json
          package_tier: string
          partner_id: string
          price_json: Json
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          benefits_json?: Json
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          metadata_json?: Json
          package_tier?: string
          partner_id: string
          price_json?: Json
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          benefits_json?: Json
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          metadata_json?: Json
          package_tier?: string
          partner_id?: string
          price_json?: Json
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_packages_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          email: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          source: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          source?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          source?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          confidence: number | null
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          tag_type: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          confidence?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          tag_type?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          confidence?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          tag_type?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_user_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_at: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          priority: string
          source_document_id: string | null
          source_plugin_family: string | null
          source_selection_id: string | null
          status: string
          title: string
          workspace_id: string | null
        }
        Insert: {
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          priority?: string
          source_document_id?: string | null
          source_plugin_family?: string | null
          source_selection_id?: string | null
          status?: string
          title: string
          workspace_id?: string | null
        }
        Update: {
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          priority?: string
          source_document_id?: string | null
          source_plugin_family?: string | null
          source_selection_id?: string | null
          status?: string
          title?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_selection_id_fkey"
            columns: ["source_selection_id"]
            isOneToOne: false
            referencedRelation: "selections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          actions_executed: number
          compute_cost_cents: number
          created_at: string
          documents_processed: number
          explanations_count: number
          id: string
          llm_cost_cents: number
          period_end: string
          period_start: string
          plugin_usage: Json | null
          simulations_count: number
          user_id: string
          verifications_count: number
        }
        Insert: {
          actions_executed?: number
          compute_cost_cents?: number
          created_at?: string
          documents_processed?: number
          explanations_count?: number
          id?: string
          llm_cost_cents?: number
          period_end: string
          period_start: string
          plugin_usage?: Json | null
          simulations_count?: number
          user_id: string
          verifications_count?: number
        }
        Update: {
          actions_executed?: number
          compute_cost_cents?: number
          created_at?: string
          documents_processed?: number
          explanations_count?: number
          id?: string
          llm_cost_cents?: number
          period_end?: string
          period_start?: string
          plugin_usage?: Json | null
          simulations_count?: number
          user_id?: string
          verifications_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          environment: string
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          environment?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          environment?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_audit: {
        Row: {
          actual_result: string | null
          check_type: string
          confidence: number | null
          created_at: string
          domain: string
          expected_result: string | null
          id: string
          input_expression: string | null
          passed: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          step_id: string | null
          was_false_negative: boolean | null
          was_false_positive: boolean | null
          workspace_id: string | null
        }
        Insert: {
          actual_result?: string | null
          check_type: string
          confidence?: number | null
          created_at?: string
          domain: string
          expected_result?: string | null
          id?: string
          input_expression?: string | null
          passed: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          step_id?: string | null
          was_false_negative?: boolean | null
          was_false_positive?: boolean | null
          workspace_id?: string | null
        }
        Update: {
          actual_result?: string | null
          check_type?: string
          confidence?: number | null
          created_at?: string
          domain?: string
          expected_result?: string | null
          id?: string
          input_expression?: string | null
          passed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          step_id?: string | null
          was_false_negative?: boolean | null
          was_false_positive?: boolean | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_audit_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_object_versions: {
        Row: {
          analysis_run_id: string | null
          change_notes: string | null
          created_at: string | null
          created_by: string | null
          diff_summary_json: Json | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          snapshot_json: Json
          state: string
          verification_object_id: string
          version_number: number
        }
        Insert: {
          analysis_run_id?: string | null
          change_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          diff_summary_json?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_json: Json
          state?: string
          verification_object_id: string
          version_number: number
        }
        Update: {
          analysis_run_id?: string | null
          change_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          diff_summary_json?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_json?: Json
          state?: string
          verification_object_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "verification_object_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_object_versions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_object_versions_verification_object_id_fkey"
            columns: ["verification_object_id"]
            isOneToOne: false
            referencedRelation: "verification_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_objects: {
        Row: {
          created_at: string | null
          current_version_id: string | null
          document_id: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          object_type: string
          share_token: string | null
          state: string
          title: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          current_version_id?: string | null
          document_id?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          object_type: string
          share_token?: string | null
          state?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          current_version_id?: string | null
          document_id?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          object_type?: string
          share_token?: string | null
          state?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "verification_object_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_objects_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_objects_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_objects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contact_profiles: {
        Row: {
          confidence_json: Json
          created_at: string
          id: string
          linked_profile_id: string | null
          phone_number: string
          preferred_language: string
          profile_json: Json
          project_readiness: string
          readiness_score: number
          relationship_role: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          confidence_json?: Json
          created_at?: string
          id?: string
          linked_profile_id?: string | null
          phone_number: string
          preferred_language?: string
          profile_json?: Json
          project_readiness?: string
          readiness_score?: number
          relationship_role?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          confidence_json?: Json
          created_at?: string
          id?: string
          linked_profile_id?: string | null
          phone_number?: string
          preferred_language?: string
          profile_json?: Json
          project_readiness?: string
          readiness_score?: number
          relationship_role?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_buyer_profiles_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ingestion_bindings: {
        Row: {
          binding_name: string | null
          created_at: string
          id: string
          is_default: boolean
          last_used_at: string | null
          phone_number: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          binding_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          phone_number: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          binding_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          last_used_at?: string | null
          phone_number?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_whatsapp_bindings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_whatsapp_bindings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ingestion_sessions: {
        Row: {
          active_document_id: string | null
          created_at: string
          last_inbound_message_id: string | null
          phone_number: string
          state_json: Json
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          active_document_id?: string | null
          created_at?: string
          last_inbound_message_id?: string | null
          phone_number: string
          state_json?: Json
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          active_document_id?: string | null
          created_at?: string
          last_inbound_message_id?: string | null
          phone_number?: string
          state_json?: Json
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_sessions_active_document_id_fkey"
            columns: ["active_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_sessions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          trigger_payload: Json | null
          workflow_id: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          trigger_payload?: Json | null
          workflow_id: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          trigger_payload?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          step_index: number
          step_type: string
          workflow_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          step_index: number
          step_type: string
          workflow_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          step_index?: number
          step_type?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          plugin_family: string | null
          trigger_filter: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          plugin_family?: string | null
          trigger_filter?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          plugin_family?: string | null
          trigger_filter?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_agent_states: {
        Row: {
          conversation_id: string
          created_at: string
          opened_document_id: string | null
          pending_kind: string | null
          state_json: Json
          status: string
          ui_surface: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          opened_document_id?: string | null
          pending_kind?: string | null
          state_json?: Json
          status?: string
          ui_surface?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          opened_document_id?: string | null
          pending_kind?: string | null
          state_json?: Json
          status?: string
          ui_surface?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_agent_states_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_agent_states_opened_document_id_fkey"
            columns: ["opened_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_agent_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_agent_states_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_api_connection_secrets: {
        Row: {
          alg: string
          connection_id: string
          created_at: string
          id: string
          key_id: string
          secret_ciphertext: string
          updated_at: string
        }
        Insert: {
          alg?: string
          connection_id: string
          created_at?: string
          id?: string
          key_id: string
          secret_ciphertext: string
          updated_at?: string
        }
        Update: {
          alg?: string
          connection_id?: string
          created_at?: string
          id?: string
          key_id?: string
          secret_ciphertext?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_api_connection_secrets_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "workspace_api_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_api_connections: {
        Row: {
          auth_config_json: Json
          auth_mode: string
          body_template: Json | null
          consecutive_failure_count: number
          created_at: string
          created_by: string | null
          description: string | null
          endpoint_url: string
          headers_template: Json
          http_method: string
          id: string
          last_error: string | null
          last_fetched_at: string | null
          last_successful_fetch_at: string | null
          mapping_generated_at: string | null
          mapping_generated_from_prompt: string | null
          mapping_status: string
          mapping_summary_json: Json
          mcp_config_json: Json
          name: string
          normalization_config_json: Json
          query_params: Json
          refresh_policy: string
          response_schema_hint: string | null
          source_kind: string
          source_mode: string
          status: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          auth_config_json?: Json
          auth_mode?: string
          body_template?: Json | null
          consecutive_failure_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          endpoint_url: string
          headers_template?: Json
          http_method?: string
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_successful_fetch_at?: string | null
          mapping_generated_at?: string | null
          mapping_generated_from_prompt?: string | null
          mapping_status?: string
          mapping_summary_json?: Json
          mcp_config_json?: Json
          name: string
          normalization_config_json?: Json
          query_params?: Json
          refresh_policy?: string
          response_schema_hint?: string | null
          source_kind?: string
          source_mode?: string
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          auth_config_json?: Json
          auth_mode?: string
          body_template?: Json | null
          consecutive_failure_count?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          endpoint_url?: string
          headers_template?: Json
          http_method?: string
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_successful_fetch_at?: string | null
          mapping_generated_at?: string | null
          mapping_generated_from_prompt?: string | null
          mapping_status?: string
          mapping_summary_json?: Json
          mcp_config_json?: Json
          name?: string
          normalization_config_json?: Json
          query_params?: Json
          refresh_policy?: string
          response_schema_hint?: string | null
          source_kind?: string
          source_mode?: string
          status?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_api_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_api_source_attachments: {
        Row: {
          api_connection_id: string
          created_at: string
          created_by: string | null
          enabled_by_default: boolean
          id: string
          sort_index: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          api_connection_id: string
          created_at?: string
          created_by?: string | null
          enabled_by_default?: boolean
          id?: string
          sort_index?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          api_connection_id?: string
          created_at?: string
          created_by?: string | null
          enabled_by_default?: boolean
          id?: string
          sort_index?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_api_source_attachments_api_connection_id_fkey"
            columns: ["api_connection_id"]
            isOneToOne: false
            referencedRelation: "workspace_api_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_api_source_attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_data_locality_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          job_payload: Json
          progress: number
          region_code: string
          requested_by: string
          result: Json
          started_at: string | null
          status: string
          step: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          job_payload?: Json
          progress?: number
          region_code: string
          requested_by: string
          result?: Json
          started_at?: string | null
          status: string
          step: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          job_payload?: Json
          progress?: number
          region_code?: string
          requested_by?: string
          result?: Json
          started_at?: string | null
          status?: string
          step?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_data_locality_runs_region_code_fkey"
            columns: ["region_code"]
            isOneToOne: false
            referencedRelation: "data_locality_regions"
            referencedColumns: ["region_code"]
          },
          {
            foreignKeyName: "workspace_data_locality_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_data_locality_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_data_planes: {
        Row: {
          config_json: Json
          created_at: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config_json: Json
          created_at?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config_json?: Json
          created_at?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_data_planes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_equity_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          relationship_kind: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          relationship_kind?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          relationship_kind?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_equity_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "equity_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_equity_companies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_folders: {
        Row: {
          analysis_policy: string
          buyer_entity_id: string | null
          buyer_readiness_profile_id: string | null
          color: string | null
          created_at: string
          deleted_at: string | null
          folder_kind: string | null
          icon: string | null
          id: string
          metadata_json: Json
          name: string
          parent_id: string | null
          related_opportunity_id: string | null
          sensitivity_level: string
          sort_index: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          analysis_policy?: string
          buyer_entity_id?: string | null
          buyer_readiness_profile_id?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          folder_kind?: string | null
          icon?: string | null
          id?: string
          metadata_json?: Json
          name: string
          parent_id?: string | null
          related_opportunity_id?: string | null
          sensitivity_level?: string
          sort_index?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          analysis_policy?: string
          buyer_entity_id?: string | null
          buyer_readiness_profile_id?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          folder_kind?: string | null
          icon?: string | null
          id?: string
          metadata_json?: Json
          name?: string
          parent_id?: string | null
          related_opportunity_id?: string | null
          sensitivity_level?: string
          sort_index?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workspace_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          analysis_brief: string | null
          color: string | null
          created_at: string
          dashboard_focus_mode: string
          default_playbook_id: string | null
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          org_id: string | null
          owner_id: string
          parent_folder_id: string | null
          preparation_metadata: Json
          preparation_status: string | null
          primary_company_id: string | null
          primary_plugin_family: string | null
          primary_property_id: string | null
          sort_index: number | null
          status: string
          updated_at: string
          workspace_domain: string | null
          workspace_kind: string
          workspace_type: string
        }
        Insert: {
          analysis_brief?: string | null
          color?: string | null
          created_at?: string
          dashboard_focus_mode?: string
          default_playbook_id?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          org_id?: string | null
          owner_id: string
          parent_folder_id?: string | null
          preparation_metadata?: Json
          preparation_status?: string | null
          primary_company_id?: string | null
          primary_plugin_family?: string | null
          primary_property_id?: string | null
          sort_index?: number | null
          status?: string
          updated_at?: string
          workspace_domain?: string | null
          workspace_kind?: string
          workspace_type?: string
        }
        Update: {
          analysis_brief?: string | null
          color?: string | null
          created_at?: string
          dashboard_focus_mode?: string
          default_playbook_id?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          org_id?: string | null
          owner_id?: string
          parent_folder_id?: string | null
          preparation_metadata?: Json
          preparation_status?: string | null
          primary_company_id?: string | null
          primary_plugin_family?: string | null
          primary_property_id?: string | null
          sort_index?: number | null
          status?: string
          updated_at?: string
          workspace_domain?: string | null
          workspace_kind?: string
          workspace_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "equity_companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      activation_conversion_state: {
        Row: {
          activation_opportunity_id: string | null
          approval_gates: number | null
          land_sourcing_runs: number | null
          last_approval_gate_at: string | null
          last_land_sourcing_at: string | null
          matches: number | null
          party_type: string | null
          rfq_id: string | null
          route_recommendation: string | null
          sourced_options: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_opportunities_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activation_hard_stop_summary: {
        Row: {
          hard_stop: string | null
          party_type: string | null
          rfq_id: string | null
          route_recommendation: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_opportunities_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      activation_request_queue: {
        Row: {
          activation_opportunity_id: string | null
          city: string | null
          delivery_timeline: string | null
          hard_stops_json: Json | null
          mandate_id: string | null
          missing_fields_json: Json | null
          party_type: string | null
          rfq_created_at: string | null
          rfq_id: string | null
          route_recommendation: string | null
          score_json: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
          use_case: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_opportunities_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "buyer_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_opportunities_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_opportunities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _temp_publish_system_playbook_version_prompt_only: {
        Args: { p_changelog: string; p_name: string; p_spec_json: Json }
        Returns: undefined
      }
      apply_subscription_payment_success: {
        Args: {
          p_card_brand?: string
          p_card_holder_name?: string
          p_card_last_four?: string
          p_expires_at?: string
          p_force_auto_renew?: boolean
          p_gateway_event_id?: string
          p_moyasar_invoice_id: string
          p_moyasar_payment_id: string
          p_paid_at?: string
          p_payment_amount_cents: number
          p_payment_currency: string
          p_payment_method_token?: string
          p_payment_record_id: string
          p_subscription_period: string
          p_subscription_tier: string
          p_user_id: string
          p_verification_source: string
        }
        Returns: Json
      }
      assert_property_component_belongs_to_property: {
        Args: {
          p_component_id: string
          p_property_id: string
          p_relation: string
        }
        Returns: undefined
      }
      assert_vendor_matches_property: {
        Args: { p_property_id: string; p_relation: string; p_vendor_id: string }
        Returns: undefined
      }
      assert_workspace_matches_property: {
        Args: { p_property_id: string; p_workspace_id: string }
        Returns: undefined
      }
      billing_period_end: { Args: { p_period_start: string }; Returns: string }
      billing_period_start: { Args: { p_at?: string }; Returns: string }
      calculate_section_status: {
        Args: {
          p_marked_understood: boolean
          p_min_explanations: number
          p_section_opened: boolean
        }
        Returns: string
      }
      can_access_buyer_entity: {
        Args: { p_buyer_entity_id: string }
        Returns: boolean
      }
      can_access_equity_company: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      can_access_property: { Args: { p_property_id: string }; Returns: boolean }
      can_access_workspace: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      can_manage_workspace_members: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      can_write_buyer_entity: {
        Args: { p_buyer_entity_id: string }
        Returns: boolean
      }
      can_write_equity_company: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      can_write_property: { Args: { p_property_id: string }; Returns: boolean }
      can_write_workspace: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      check_and_charge_billable_op: {
        Args: {
          p_metadata?: Json
          p_operation_key: string
          p_source?: string
          p_units?: number
          p_user_id: string
          p_workspace_id?: string
        }
        Returns: Json
      }
      check_and_increment_ask: { Args: { p_user_id: string }; Returns: Json }
      check_and_increment_explanation: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_and_increment_hourly_usage: {
        Args: { p_amount: number; p_usage_type: string; p_user_id: string }
        Returns: Json
      }
      check_and_increment_search: { Args: { p_user_id: string }; Returns: Json }
      check_and_increment_usage: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: Json
      }
      check_document_limit: { Args: { p_user_id: string }; Returns: Json }
      check_feature_access: {
        Args: { p_feature: string; p_user_id: string }
        Returns: Json
      }
      check_plan_feature: {
        Args: { p_feature: string; p_tier: string }
        Returns: boolean
      }
      check_storage_limit: {
        Args: { p_file_size: number; p_user_id: string }
        Returns: Json
      }
      cleanup_expired_deleted_items: {
        Args: never
        Returns: {
          documents_deleted: number
          notes_deleted: number
          tasks_deleted: number
          workspaces_deleted: number
        }[]
      }
      compute_content_fingerprint: {
        Args: { p_page_texts: string[]; p_pages_to_hash?: number }
        Returns: string
      }
      compute_content_hash: { Args: { p_content: string }; Returns: string }
      create_conversation: {
        Args: {
          p_context_text?: string
          p_document_id?: string
          p_note_id?: string
          p_selection_id?: string
          p_user_id: string
        }
        Returns: string
      }
      days_until_permanent_deletion: {
        Args: { deleted_timestamp: string }
        Returns: number
      }
      default_workspace_corpus_id: {
        Args: { p_workspace_id: string }
        Returns: string
      }
      downgrade_to_free: { Args: { p_user_id: string }; Returns: undefined }
      ensure_billing_usage_monthly: {
        Args: { p_at?: string; p_user_id: string }
        Returns: {
          billable_ops_used: number
          breakdown: Json
          created_at: string
          metered_tokens_used: number
          period_end: string
          period_start: string
          raw_cached_input_tokens: number
          raw_embedding_tokens: number
          raw_input_tokens: number
          raw_output_tokens: number
          storage_bytes_snapshot: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "billing_usage_monthly"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_home_workspace:
        | { Args: { p_user_id: string }; Returns: string }
        | {
            Args: {
              p_org_name?: string
              p_user_id: string
              p_workspace_name?: string
            }
            Returns: string
          }
      ensure_workspace_default_corpus: {
        Args: { p_workspace_id: string }
        Returns: string
      }
      enter_grace_period: {
        Args: { p_days?: number; p_user_id: string }
        Returns: undefined
      }
      evaluate_property_listing_completion: {
        Args: { overlay_payload: Json }
        Returns: Json
      }
      find_canonical_match: {
        Args: { p_content_fingerprint?: string; p_isbn?: string }
        Returns: string
      }
      find_overlapping_lines: {
        Args: {
          p_document_id: string
          p_page_number: number
          p_x_max: number
          p_x_min: number
          p_y_max: number
          p_y_min: number
        }
        Returns: {
          confidence: number
          content_latex: string
          content_text: string
          id: string
          line_index: number
          line_type: string
        }[]
      }
      generate_vector_key: {
        Args: {
          p_chunk_id: string
          p_model: string
          p_version: string
          p_workspace_id: string
        }
        Returns: string
      }
      get_active_embedding_config: {
        Args: { p_workspace_id: string }
        Returns: {
          index_name: string
          model: string
          version: string
        }[]
      }
      get_chunks_needing_embeddings: {
        Args: {
          p_document_id: string
          p_limit?: number
          p_model?: string
          p_version?: string
        }
        Returns: {
          chunk_id: string
          content_hash: string
          content_text: string
          document_id: string
          page_number: number
          user_id: string
          workspace_id: string
        }[]
      }
      get_conversation_history: {
        Args: { p_conversation_id: string; p_limit?: number }
        Returns: {
          content: string
          created_at: string
          id: string
          request_type: string
          role: string
        }[]
      }
      get_default_payment_method: {
        Args: { p_user_id: string }
        Returns: {
          card_brand: string
          card_last_four: string
          id: string
          moyasar_token: string
        }[]
      }
      get_effective_limit_plan_tier: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_effective_subscription_tier_for_user: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_folder_path: {
        Args: { folder_id: string }
        Returns: {
          depth: number
          id: string
          name: string
        }[]
      }
      get_or_create_daily_usage: {
        Args: { p_user_id: string }
        Returns: {
          contract_analyses_count: number | null
          created_at: string | null
          explanations_count: number | null
          handwriting_ocr_count: number | null
          id: string
          semantic_searches_count: number | null
          solution_checks_count: number | null
          updated_at: string | null
          usage_date: string
          user_id: string
          workspace_organization_count: number | null
        }
        SetofOptions: {
          from: "*"
          to: "daily_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_payments_due_for_retry: {
        Args: never
        Returns: {
          failure_count: number
          moyasar_token: string
          payment_id: string
          payment_method_id: string
          subscription_period: string
          subscription_tier: string
          user_id: string
        }[]
      }
      get_plan_features: { Args: { p_tier: string }; Returns: Json }
      get_plan_limit: {
        Args: { p_limit_key: string; p_tier: string }
        Returns: number
      }
      get_plan_limits: { Args: { p_tier: string }; Returns: Json }
      get_rag_rate_limits: { Args: { p_user_id: string }; Returns: Json }
      get_subscription_plan_for_tier: {
        Args: { p_tier: string }
        Returns: {
          badge_text: string | null
          billing_model_version: string
          created_at: string
          description: string | null
          display_features: Json
          display_order: number
          features: Json
          guardrails: Json
          highlight_color: string | null
          id: string
          is_active: boolean
          is_default: boolean
          limits: Json
          meter_limits: Json
          name: string
          price_monthly_sar: number | null
          price_monthly_usd: number | null
          price_yearly_sar: number | null
          price_yearly_usd: number | null
          product_id_monthly: string | null
          product_id_yearly: string | null
          tier: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "subscription_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_subscription_price: {
        Args: { p_currency?: string; p_period: string; p_tier: string }
        Returns: number
      }
      get_subscription_price_halalas: {
        Args: { p_period: string; p_tier: string }
        Returns: number
      }
      get_subscriptions_due_for_renewal: {
        Args: { p_hours_ahead?: number }
        Returns: {
          moyasar_token: string
          payment_method_id: string
          subscription_expires_at: string
          subscription_period: string
          subscription_tier: string
          user_id: string
        }[]
      }
      get_user_limits_status: { Args: { p_user_id: string }; Returns: Json }
      get_user_subscription_state: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_workspace_stats: {
        Args: { p_workspace_id: string }
        Returns: {
          document_count: number
          note_count: number
          task_count: number
          total_items: number
        }[]
      }
      has_mathpix_ocr: { Args: { p_document_id: string }; Returns: boolean }
      increment_daily_usage: {
        Args: { p_column: string; p_usage_date: string; p_user_id: string }
        Returns: undefined
      }
      is_recoverable: { Args: { deleted_timestamp: string }; Returns: boolean }
      is_workspace_member: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      is_workspace_org_multi_user_enabled: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      is_workspace_owner: { Args: { p_workspace_id: string }; Returns: boolean }
      list_accessible_workspaces: {
        Args: never
        Returns: {
          access_role: string
          access_source: string
          color: string
          created_at: string
          deleted_at: string
          description: string
          icon: string
          id: string
          name: string
          org_id: string
          owner_id: string
          parent_folder_id: string
          primary_plugin_family: string
          sort_index: number
          status: string
          updated_at: string
          workspace_type: string
        }[]
      }
      merge_subscription_state: {
        Args: {
          p_candidate_auto_renew?: boolean
          p_candidate_cancelled_at?: string
          p_candidate_expires_at: string
          p_candidate_grace_period_ends_at?: string
          p_candidate_period: string
          p_candidate_source: string
          p_candidate_status?: string
          p_candidate_tier: string
          p_latest_transaction_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      normalize_limit_plan_tier: {
        Args: { p_raw_tier: string }
        Returns: string
      }
      normalize_subscription_plan_tier: {
        Args: { p_raw_tier: string }
        Returns: string
      }
      pgmq_delete: {
        Args: { msg_id: number; queue_name: string }
        Returns: boolean
      }
      pgmq_read: {
        Args: { n: number; queue_name: string; sleep_seconds: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          vt: string
        }[]
      }
      pgmq_send: {
        Args: { message: Json; queue_name: string; sleep_seconds?: number }
        Returns: number
      }
      pgmq_send_batch: {
        Args: { messages: Json[]; queue_name: string; sleep_seconds?: number }
        Returns: number[]
      }
      pipeline_claim_ready_nodes: {
        Args: {
          p_lease_seconds?: number
          p_limit?: number
          p_worker_id?: string
        }
        Returns: {
          attempt_count: number
          completed_at: string
          created_at: string
          id: string
          input_json: Json
          last_error_code: string
          last_error_message: string
          lease_token: string
          lease_worker_id: string
          leased_until: string
          max_attempts: number
          next_retry_at: string
          node_id: string
          node_kind: string
          output_json: Json
          output_preview_json: Json
          run_id: string
          started_at: string
          status: string
          topo_order: number
          updated_at: string
        }[]
      }
      record_metered_tokens: {
        Args: {
          p_cached_input_tokens?: number
          p_embedding_tokens?: number
          p_input_tokens?: number
          p_metadata?: Json
          p_model_key: string
          p_output_tokens?: number
          p_source?: string
          p_user_id: string
          p_workspace_id?: string
        }
        Returns: Json
      }
      reset_daily_explanations: { Args: never; Returns: undefined }
      save_renovation_capex_estimate: {
        Args: {
          p_acquisition_opportunity_id: string
          p_acquisition_scenario_id?: string
          p_base_total?: number
          p_confidence_score?: number
          p_created_by?: string
          p_estimator_version?: string
          p_event_type?: string
          p_high_total?: number
          p_input_json?: Json
          p_low_total?: number
          p_org_id?: string
          p_output_json?: Json
          p_rate_card_id?: string
        }
        Returns: Json
      }
      search_document_chunks:
        | {
            Args: {
              p_document_id: string
              p_match_count?: number
              p_match_threshold?: number
              p_query_embedding: string
            }
            Returns: {
              chunk_type: string
              content_latex: string
              content_text: string
              id: string
              page_number: number
              similarity: number
            }[]
          }
        | {
            Args: {
              filter_document_ids?: string[]
              filter_workspace_ids?: string[]
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              content_text: string
              document_id: string
              id: string
              language: string
              page_number: number
              similarity: number
              workspace_id: string
            }[]
          }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_folder_cascade: {
        Args: { target_folder_id: string }
        Returns: undefined
      }
      subscription_entitlement_is_active: {
        Args: {
          p_expires_at?: string
          p_grace_period_ends_at?: string
          p_status?: string
          p_tier: string
        }
        Returns: boolean
      }
      subscription_tier_rank: { Args: { p_tier: string }; Returns: number }
      update_storage_usage: {
        Args: { p_delta: number; p_user_id: string }
        Returns: undefined
      }
      update_study_streak: { Args: { p_user_id: string }; Returns: undefined }
      update_user_subscription: {
        Args: {
          p_expires_at: string
          p_period: string
          p_tier: string
          p_user_id: string
        }
        Returns: undefined
      }
      workspace_member_role: {
        Args: { p_workspace_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
