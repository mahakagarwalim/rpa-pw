/** Modules */
import mongoose from 'mongoose';

/** DB Connection */
import { PrimaryConnection } from "../../Config.js";

/** Intialization */
const Schema = mongoose.Schema;

const LabelSchema = new Schema({
    name: String,
    info: String,
    active: Boolean,
    label_name: String,
    color_code: String,
    staticName: { // Once Created, Do not change this value
      type: String,
      trim: true
    },
    pipeline_id: [{
      type: Schema.ObjectId,
      ref: 'Dealboardinfo'
    }],
    label_type: String,
    agent: {
      type: Schema.ObjectId,
      ref: 'Agents'
    },
    agency_id: {
      type: Schema.ObjectId,
      ref: 'Agency'
    },
    archived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date
    },
    archivedBy: {
      type: Schema.ObjectId,
      ref: 'Agents'
    }, // who archived
    sharedTo: [{
      type: Schema.ObjectId,
      ref: 'Agents'
    }],
    rpa_label: {
      type: Boolean,
      default: false
    }
  });

let LabelsCollection = PrimaryConnection.model('Label', LabelSchema);

export default LabelsCollection;