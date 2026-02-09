/** modules */
import mongoose from "mongoose";

/** db connection */
import { primary_connection } from "../../database.config.js";

/** Intialization */
const Schema = mongoose.Schema;


const DealboardinfoSchema = new Schema({
    name: String,
    info: String,
    active: {type : Boolean, default:true},
    dealboard_name:String,// name of the board
    board_type:String,
    agent : [{
      type: Schema.ObjectId,
      ref: 'Agents'
    }],
    notAllowedAgent : [{
      type: Schema.ObjectId,
      ref: 'Agents'
    }],
    participating_agent : [{
      type: Schema.ObjectId,
      ref: 'Agents'
    }],
    queued_agent : {
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    queued_Order : Number,
    agency_id:{
      type: Schema.ObjectId,
      ref: 'Agency'
    },// agency_id (board is assosiated to which agency)
    sharedBy: {
      type: Schema.ObjectId,
      ref: 'Agency'
    },
    createdAt: {
      type:Date,
      default : Date.now
    },//creation date of the board
    category_type : String,
    default_category :[],
    custom_category : [],
    createdBy : {
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    modulesNotRequired : [],
    archivedAt:{
      type:Date
    },//archived date
    bookmarked:{
      type:Boolean,
      default:false
    },
    archived :{
      type : Boolean,
      default : false
    },// board is deleted or not
    sharable:{
      type : Boolean,
      default : false
    },// type of the board(sharable or personal)
    archivedBy : {
      type: Schema.ObjectId,
      ref: 'Agents'
    }// who deleted this board
    ,
    board_trigger:[],
    default_catgories : [{
      type: Schema.ObjectId,
      ref: 'Categories'
    }],
    add_deal_fields : [],
    automation_enabled : {
      type : Boolean,
      default : true
    },
    quoteToCloseStage : {
      type : Schema.ObjectId ,
      ref : 'Dealboard'
    },
    leadToStage : {
      type : Schema.ObjectId ,
      ref : 'Dealboard'
    },
    bolt_quoteToStage : {
      type : Schema.ObjectId ,
      ref : 'Dealboard'
    },
    inactiveDays : {
      type:Number,
      default: 0
    },
    left_modules_show : [],
    activity_modules_show : [],
    goal_wise : String,
    goalsParams: [],
    pipeline_type : String,
    ams360_autocontact_sync_settings : {
        "isEnabled" : {
          type : Boolean,
          default : false
        },
        "personal" : {
            stage_id : {
              type : Schema.ObjectId,
              ref : 'Dealboard' 
            }
        },
        "commercial" : {
            stage_id : {
              type : Schema.ObjectId,
              ref : 'Dealboard' 
            }
        },
        "health": {
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
        "life": {
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
        "nonPropertyAndCasualty": {
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
        "benefits": {
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
        "financial": {
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
        "bonds":{
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
        "agriculture":{
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
         "life_and_health":{
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
          "financial_services":{
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        },
        "other":{ 
          stage_id: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
          }
        }
    },
    restricted_to : [],
    slugArray: {
      type: Array,
      default:[]
    },
    default_values : {},
    disabled : {
      type : Boolean,
      default : false
    },
    updatedAt:{
      type:Date
    },
    updatedBy :{
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    restrict_deal_won_if_task_due : {
      type : Boolean,
      default : false
    },
    add_deal_customized : [],
    deal_type_control : String,
    show_stamp : {
      type : Boolean,
      default : true
    },
    RR_settings : {},
    mandatoryFields: {
      "wonDeals": { type: Object },
      "lostDeals": { type: Object },
      "addDeals": { type: Object },
      "addPolicies": { type: Object },
      "addContact": { type: Object },
      "addGoals": { type: Object },
      "addTask": { type: Object },
      "addAccount": { type: Object }
    },
    defaultMandatoryFields: {
      "wonDeals": { type: Object },
      "lostDeals": { type: Object },
      "addDeals": { type: Object },
      "addPolicies": { type: Object },
      "addContact": { type: Object },
      "addGoals": { type: Object },
      "addTask": { type: Object },
      "addAccount": { type: Object }
    },
    service_board_settings : [{
      default_stage : {
      type : Schema.ObjectId ,
      ref : 'Dealboard'
      },
      service_board_id:{
      type : Schema.ObjectId
      },
      status: {
        type: String,
        default:"pending"
      }, //verified,pending
      email : {
        type : String
      },
      active:{
        type:Boolean,
        default: true
      },
      isNylasConnected :{
        type:Boolean,
        default: false
      },
      isServicePipline :{
        type:Boolean,
        default: false
      },
      isNotificationEnabled :{
        type:Boolean,
        default: false
      },
      agent_id : {
          type: Schema.ObjectId,
          ref: 'Agents'
        },
      due_date:{
       type : Number,
       default : 0
      },
      service_catgories : [{
        type: Schema.ObjectId,
        ref: 'Categories'
      }],
      assignedTo:{
        accountAgent:Boolean,
        csrAgent: Boolean,
        isRoundRobinEnable: Boolean,
        roundRobinAgent:[{
          type: Schema.ObjectId,
          ref: 'Agents'
        }] ,
        assigneeAgent:[{
           type: Schema.ObjectId,
           ref: 'Agents'
        }]
      },
      deal_health: {
        type : String
      }
   }],
  }, {
    timestamps: true
});

export const dealboard_info_collection = primary_connection.model('Dealboardinfo', DealboardinfoSchema);

