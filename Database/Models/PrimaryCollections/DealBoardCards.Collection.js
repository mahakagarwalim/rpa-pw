/** modules */
import mongoose from "mongoose";

/** db connection */
import { PrimaryConnection } from "../../Config.js";

/** Intialization */
const Schema = mongoose.Schema;


const DealboardcardSchema = new Schema({

    active: Boolean,
    
    loss_date:{ // loss date of the quote
      type : Date
    },
    organisationName : String ,
    dealTitle : String ,//what is the title of the card
    value : {
      type : Number,
      default : 0
    },//what is the value of the deal
    dealInfo : String,
    deal_health: {
      type : Number,
      default : 5
    },
    deal_source: String,
    dealboard : {
      type : Schema.ObjectId ,
      ref : 'Dealboard'
  
    },//stage id to differntiate which card is related to which stage
    source: {
      type: String
    },//what is the source of this card (from website or from portal)
    user: {
      type: Schema.ObjectId,
      ref: 'User'
    },//user id (this card is related to which user)
    label_id: [{
      type: Schema.ObjectId,
      ref: 'Label',
    }],// label id(if any lable is given to this card)
    present_label_id: {
      type: Schema.ObjectId,
      ref: 'Label',
    }, // using for thodd thames
    thamesQuoteId: String,//using for thodd thames
    account_id: [{
      type: Schema.ObjectId,
      ref: 'AccountInfo'
    }],//account id (this card is related to which account)
    category_id: [{
      type: Schema.ObjectId,
      ref: 'Categories'
    }],//category id (this policy deal is related to which category)
    temp_category_id : [{
      type: Schema.ObjectId,
      ref: 'Categories'
    }],
    custom_category : [
      { type : String}
    ],
    temp_custom_category : [
      { type : String}
    ],  // custom category converted to array of string from string
    agent: [{
      type: Schema.ObjectId,
      ref: 'Agents'
    }],//agent id (this card is related to which agent)
    archived : {
      type : Boolean,
      default : false
    } ,//card is deleted or not
    checklist:[{}],
    // won : {
    //   type : Boolean,
    //   default : false
    // },
    //use for won/lost
    cardStatus : {
      type : String,
      default : 'inProcess'
    },//deal status (is this deal is done or not)
    cardStatusUpdatedAt:{
      type:Date,
      default: Date.now
    },//on which date this card is won or lost
    assignedTo:[{
          type: Schema.ObjectId,
          ref: 'Agents'
    }],//this card is assigned to which agent
    shared_with : [{
      type: Schema.ObjectId,
      ref: 'Agents'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },//creation date
    // category_id: {
    //   type: Schema.ObjectId,
    //   ref: 'Categories'
    // },
    user_defined_fields :[],
    smartContactInfo : {},
    mailThreadId:[],
    modulesNotRequired : [],
    insurance : {
      type: Schema.ObjectId,
      ref: 'Insurance'
    },//insurance id  (this card is related to which poilcy of assosiated user)
    // insurance_data :{
    //   type:Object,
    //   default : {}
    // },
    insurance_data:[],
    recentActivityOn:{},//what is the recent activity done on that card (like sms,email,activity etc)
    archivedAt: {
      type: Date
    },//deletion date
    archivedBy:{
      type: Schema.ObjectId,
      ref: 'Agents'
    },// who deleted this card
    archivedByOther:{
      type: String
    },// If deleted by other sources ( Cron )
    due_date:{
      type : Date
    },// what is the due date of this card
    agency_id :{
      type: Schema.ObjectId,
      ref: 'Agency'
    },//agency id (this card is related to which agency (sharable))
    due_date_checked:{
      type : Boolean,
      default : false
    },//is this card or deal is done on marked date
    card_position : Number,// what is the postion of the card in stage
    overview: {},
    tags: [],
    external_source_info : {
      type: Schema.ObjectId,
      ref: 'Externalcontactinfo'
    },// external contact model id(if card came from outsource like website demo request, quote genereted)
    broker_fee: String,// what is the fees of the broker
    dealboard_info: {
      type: Schema.ObjectId,
      ref: 'Dealboardinfo'
     },
     lightSpeedToken : String,
     deal_value:{
       type : String
     },// what is value of that deal
     importQuotesheet : {
       type : Boolean,
       default : false
     },// quotesheet is imported or not
     quoteCat : [{
        category_name : String,
        form_builder_form_id : {
          type: Schema.ObjectId,
          ref: 'Agentforms'
        },
        opt : [],
        quoteLang : String,
        external_source_info : {
          type: Schema.ObjectId,
          ref: 'Externalcontactinfo'
        }
     }],// what are the ctegories of the quote (auto, hometrucking etc),
     quoteLang : String,
     notes : String,
     sharable : {
      type : Boolean,
      default : false
    },
    dueDateCompleted:{
      type : Boolean,
      default : false
    },
    split_wise_quotes_old : [],
    split_wise_quotes : [{
      _id : { type: Schema.ObjectId, auto: true },
      quote_id : { type: Schema.ObjectId},
      selected_labels : [{
        type: Schema.ObjectId,
        ref: 'Label',
      }],
      agent_id:{
        type: Schema.ObjectId,
        ref: 'Agents'
      },
      won_lost_agent:{
        type: Schema.ObjectId,
        ref: 'Agents'
      },
      won_lost_date: {
        type : Date
      },
      won_lost_date_time: {
        type : Date
      },
      policy_form : String,
      reminder_date : {
        type : Date
      },
      quoted_date : {
        type : Date
      },
      policyRenewalStatus: {
        type: String,
        enum: [
          "active",
          "cancelled",
          "expired",
          "renewed",
          "nonrenewed",
          "rewritten",
          "nottaken",
          "include",
          "quote",
          "remarketing",
          "new",
          "reinstate",
          "cancelledrewritten"
      ]
      },
      quoteStatus : {
        type : String,
        default : 'inProcess'
      },
      value : {
        type : Number,
        default : 0
      },
      broker_fee:  {
        type : Number,
        default : 0
      },
      lostReason:{
        type: Schema.ObjectId,
        ref: 'DealboardReason'
      },
      insurance : {},
      category_id: [{
        type: Schema.ObjectId,
        ref: 'Categories'
      }],
      custom_category : [
        { type : String}
      ],
      temp_custom_category : [
        { type : String}
      ],
      carrier_id: {
        type: Schema.ObjectId,
        ref: 'Companie'
      },
      category: {},
      carrier : {},
      notes: {
        type: String
      },
      lostWinDesc : {
        type: String
      },
      numberOfLives : {
        type: String
      },
      coverageType : {
        type: String
      },
      insurance_type: {
          type: String
      },
      xdate_remider: {
          type: String
      },
      x_dates : [{
          nc_CategoryId: [{
              type: String
            }],
          category_id: [{
              type: Schema.ObjectId,
              ref: 'Categories'
          }],
          date: {
              type: Date
          },
          _id : { type: Schema.ObjectId, auto: true },
          archived : Boolean,
          xdateCardCreated: Boolean
      }],
      isSyncedwithSioaEpic: {
        type: String,
        enum: [ "inProcess", "synced", "notSynced" ]
      }
    }],
    quotes:[{
      _id : { type: Schema.ObjectId, auto: true },
      selected_labels : [{
        type: Schema.ObjectId,
        ref: 'Label',
      }],
      won_lost_agent:{
        type: Schema.ObjectId,
        ref: 'Agents'
      },
      won_lost_date: {
        type : Date
      },
      won_lost_date_time: {
        type : Date
      },
      deal_win_percent:{
        type:Number
       },
      policy_form : String,
      reminder_date : {
        type : Date
      },
      quoted_date : {
        type : Date
      },
      policyRenewalStatus: {
        type: String,
        enum: [
          "active",
          "cancelled",
          "expired",
          "renewed",
          "nonrenewed",
          "rewritten",
          "nottaken",
          "include",
          "quote",
          "remarketing",
          "new",
          "reinstate",
          "cancelledrewritten"
      ]
      },
      quoteStatus : {
        type : String,
        default : 'inProcess'
      },
      value : {
        type : Number,
        default : 0
      },
      broker_fee:  {
        type : Number,
        default : 0
      },
      be_broker_fee : {
        type : Number,
        default : 0
      },
      lostReason:{
        type: Schema.ObjectId,
        ref: 'DealboardReason'
      },
      insurance : {},
      category_id: [{
        type: Schema.ObjectId,
        ref: 'Categories'
      }],
      custom_category : [
        { type : String}
      ],
      temp_custom_category : [
        { type : String}
      ],
      carrier_id: {
        type: Schema.ObjectId,
        ref: 'Companie'
      },
      category: {},
      carrier : {},
      notes: {
        type: String
      },
      lostWinDesc : {
        type: String
      },
      numberOfLives : {
        type: String
      },
      coverageType : {
        type: String
      },
      insurance_type: {
          type: String
      },
      xdate_remider: {
          type: String
      },
      x_dates : [{
          nc_CategoryId: [{
              type: String
            }],
          category_id: [{
              type: Schema.ObjectId,
              ref: 'Categories'
          }],
          date: {
              type: Date
          },
          _id : { type: Schema.ObjectId, auto: true },
          archived : Boolean,
          xdateCardCreated: Boolean
      }],
      isSyncedwithSioaEpic: {
        type: String,
        enum: [ "inProcess", "synced", "notSynced" ]
      },
      isSyncedwithSioaEpicErrSuccessMsg: {
        type: String
      },
      card_open_day_before : Number,
      card_open_day_flag : Boolean,
      card_reminder_before : Number,
      card_reminder_flag : Boolean
    }],
    archiveOpportunities:{
      type:Boolean,
      default:false
    },
    lostReason:{
       type:Schema.ObjectId,
       ref:'DealboardReason'
    },
    final_action: [{}],
    noteOpportunity: {
      type: String
    },
    expected_closing_date:{
      type : Date
    },
    stage_change_logs:{},
    dealReferral: {
      type: Schema.ObjectId,
      ref: 'DealReferral'
    },
    won_agent:{
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    lost_agent:{
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    won_lost_agent:{
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    won_lost_date: {
      type : Date
    },
    version: {
      type : String,
      default: 'v2'
    }, // store the version of dealboard card - v2 (represent new dealboardcard architecture)
    createdFor : String,
    probability : String,
    card_commission : String,
    slug_value_change : String,
    primary_agent:{
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    additional_users: [{
      type: Schema.ObjectId,
      ref: 'User'
    }],
    createdOrUpdatedBy: { // by how this data is created by zap/integration/upload/im kind of stores
      type: String
    },
    slug: {
      type: String
    },
    plan_id: [{
      type: Schema.ObjectId,
      ref: 'plans'
    }],
    dealcard_type:[],
    groups: [{
        type: Schema.ObjectId,
        ref: 'groups'
    }],
    createdSource: {
        type: String,
        trim: true
    },
    "deal_values" : {},
    "deal_revenues" : {},
    workflow_id: {
        type: Schema.ObjectId,
        ref: 'Workflow'
    },
    slugArray: {
      type: Array,
      default:[]
    },
    ams360CorrectionSlug: {
      type: String
    },
    task_ids : [],
    ams360CustomerId: String,
    ams360ClaimId: String,
    ams360ClaimData: Object,
    ams360PolicyId: String,
    insureZoneLinkURL: String,
    created_byModule : String,
    hide_completed_checklist_items : {
      type : Boolean,
      default : false
    },
    broker_id:{
      type: String
    },
    isDataEnriched: {
      type: Boolean,
      default: false
    },
    // this we introduced to store the GCID given via lead api, requested by SIOA team
    sioaGcid: {
      type: String
    },
    temp_mapping_id: {
      type: Schema.ObjectId
    },
    csrAgentNames: {
      type: Array
    },
    lead_id : String,
    merge_to_master_id : String,
    iwins_id : String,
    split_revenue_change : {},
    split_revenue_change_old : {},
    slugObj: {
      type: Object
    },
    CardAutomationLogs: Array,
    QPS_Quotes: Object,
    summary : String,
    quoteRushLeadId: String,
    quoteRushMessage: String,
    QRAutoQuotes: Array,
    QRHomeQuotes: Array,
    lastVisitedAt: {
        type: Date,
        default: Date.now
    },
    imDealNumber : Number,
    bolt_config : {},
    isServicePipline :{
        type:Boolean,
        default: false
    },
    split_wise_quotes_updated : Boolean,
    premium_rate_s : Boolean,
    jointAppointment: [{
      type: Schema.ObjectId,
      ref: 'Agents'
    }],//agent id of joint appointment
    be_data_points: {
      type: [{
        key: { type: String, trim: true },
        value: { type: mongoose.Schema.Types.Mixed } 
      }],
      default: []
    }
  }, {
    timestamps: true
});

export const DealBoardCardsCollection = PrimaryConnection.model('DealBoardCards', DealboardcardSchema);
