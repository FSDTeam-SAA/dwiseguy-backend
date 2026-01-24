import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { contactService } from "./contact.service";
import { Request, Response } from "express";

const createContactUs = catchAsync(async (req: Request, res: Response) => {
    const result = await contactService.contactUsFromDb(req.body);

    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Contact us form submitted successfully",
        data: result,
    });
});

export const contactusController = {
    createContactUs,
};