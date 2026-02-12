/** Modules */
import mongoose from 'mongoose';

/** DB Connection */
import { PrimaryConnection } from "../../Config.js";

/** Intialization */
const Schema = mongoose.Schema;


const CategoriesSchema = new Schema({
    category_name: {
        type: String,
        required: true
    },
    alias: {
        type: String,
        default: null
    },
    category_details: {
        type: String,
    },
    iconUrl: {
        type: String,
    },
    bannerUrl: {
        type: String,
    },
    insurance_type: [
        { type: String }
    ],
    category_status: {
        type: String,
    },
    category_type: {
        type: String,
    },
    masterCategory: [{
        type: Schema.ObjectId,
        ref: 'Categories'
    }],
    merged_category_id: [{
        type: Schema.ObjectId,
        ref: 'Categories'
    }],// policy is related to which category(like Auto , Life etc)
    category_array: [{
        type: String
    }],
    category_add_date: {
        type: Date,
        default: Date.now
    },
    agency_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Agency'
    },//(this category is related to which agency)
    refreshdate: {
        type: Date
    },
    archived: {
        type: Boolean,
        default: false
    },
    dataUpdatedOn: {
        type: Date
    },
    /**benefitPoint DataPoints */
    bpCategoryID: {
        type: Number
    },
    amsSource: {
        type: String
    },
    ams360LOBCode: {
        type: String
    },
    ams360TypeCode: {
        type: Number
    },
    ams360IncomeGroup: {
        type: String
    },
    nexsureLobId: {
        type: Number
    },
    nexsureLOBAliasId: {
        type: Number
    },
    nexsureCategoryId: {
        type: Schema.ObjectId,
        ref: "NexsureCategories"
    },
    visibility: {
        type: Boolean,
        default: true
    },
    visibiltyOffBy: String,
    // sagitta category code
    sagittaCoverageCd: {
        type: String
    },
    // sagitta category id
    sagittaCategoryId: {
        type: String
    },
    qqCategoryId:{
        type: Number
    }
},
    {
        timestamps: {
            createdAt: true,
            updatedAt: true
        }
    });


let CategoriesCollection = PrimaryConnection.model('Categories', CategoriesSchema);

export default CategoriesCollection;