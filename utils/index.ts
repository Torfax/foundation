import { DateUtilService } from "./DateUtilService";
import { ObjectUtilService } from "./ObjectUtilService";
import StringUtilService from "./StringUtilsService";

export class UtilsModule {


    private readonly dateUtilService: DateUtilService;
    private readonly objectUtilService: ObjectUtilService;
    private readonly stringUtilService: StringUtilService;

    constructor() {
        this.dateUtilService = new DateUtilService();
        this.objectUtilService = new ObjectUtilService();
        this.stringUtilService = new StringUtilService();
    }

    get api() {
        return {
            date: this.dateUtilService,
            object: this.objectUtilService,
            strings: this.stringUtilService
        };
    }
}