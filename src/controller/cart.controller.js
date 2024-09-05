import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product/product.model.js";
import { isValidObjectId, startSession } from "mongoose";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const addProductToCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    if (!isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }
    if (quantity < 1) {
        throw new ApiError(400, "Invalid quantity");
    }

    const session = await startSession();
    session.startTransaction();

    try {
        // Fetch or create cart
        let cart = await Cart.findOne({ cartOwner: req.user._id }).session(session);

        if (!cart) {
            cart = new Cart({ cartOwner: req.user._id, cartItems: [] });
            await cart.save({ session });
        }


        // Fetch product
        const product = await Product.findById(productId).session(session);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        if (product.productQuantity < quantity) {
            throw new ApiError(400, "Insufficient quantity in stock");
        }

        // Find or add cart item
        const existingItem = cart.cartItems.find(item => item.product.toString() === product._id.toString());

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.cartItems.push({ product: productId, quantity });
        }

        // Update product quantity
        product.productQuantity -= quantity;

        // Save changes
        await Promise.all([
            cart.save({ session }),
            product.save({ session })
        ]);

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json(new ApiResponse(201, cart, "Product added to cart"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error adding product to cart:", error);
        throw new ApiError(500, "Failed to add product to cart");
    }
});


const getUserCart = asyncHandler(async (req, res) => {
    // const cart = await Cart.findOne({ cartOwner: req.user._id }).populate("cartItems.product");

    const pipeline = [
        {
            $match: {
                cartOwner: req.user._id
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "cartItems.product",
                foreignField: "_id",
                as: "productDetails",
            }
        },
        {
            $addFields: {
                cartItems: {
                    $map: {
                        input: "$cartItems",
                        as: "item",
                        in: {
                            product: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$productDetails",
                                            as: "product",
                                            cond: { $eq: ["$$product._id", "$$item.product"] }
                                        }
                                    },
                                    0
                                ]
                            },
                            quantity: "$$item.quantity"
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                totalAmount: {
                    $sum: {
                        $map: {
                            input: "$cartItems",
                            as: "item",
                            in: {
                                $multiply: ["$$item.product.productPrice", "$$item.quantity"]
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                cartItems: 1,
                totalAmount: 1
            }
        }
    ];


    const cart = await Cart.aggregate(pipeline);

    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    return res.status(200).json(new ApiResponse(200, cart[0], "Cart retrieved successfully"));
});


const removeProductFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    const session = await startSession();
    session.startTransaction();

    try {
        // Fetch cart
        let cart = await Cart.findOne({ cartOwner: req.user._id }).session(session);

        if (!cart) {
            throw new ApiError(404, "Cart not found");
        }

        // Find item in cart
        const existingItemIndex = cart.cartItems.findIndex(item => item.product.toString() === productId);

        if (existingItemIndex === -1) {
            throw new ApiError(404, "Product not found in cart");
        }

        // Fetch product
        const product = await Product.findById(productId).session(session);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        // Update product quantity and cart
        product.productQuantity += cart.cartItems[existingItemIndex].quantity;
        cart.cartItems.splice(existingItemIndex, 1);

        // Save changes
        await Promise.all([
            cart.save({ session }),
            product.save({ session })
        ]);

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json(new ApiResponse(200, cart, "Product removed from cart"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error removing product from cart:", error);
        throw new ApiError(500, "Failed to remove product from cart");
    }
});


const incrementCartItemQuantity = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { incrementBy = 1 } = req.body;

    if (!isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }
    if (incrementBy <= 0) {
        throw new ApiError(400, "Invalid increment value");
    }

    try {
        let cart = await Cart.findOne({ cartOwner: req.user._id });

        if (!cart) {
            throw new ApiError(404, "Cart not found");
        }

        const cartItem = cart.cartItems.find(item => item.product.toString() === productId);

        if (!cartItem) {
            throw new ApiError(404, "Product not found in cart");
        }

        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        if (incrementBy > product.productQuantity) {
            throw new ApiError(400, "Insufficient quantity in stock");
        }

        cartItem.quantity += incrementBy;
        product.productQuantity -= incrementBy;

        await Promise.all([
            cart.save(),
            product.save()
        ]);

        return res.status(200).json(new ApiResponse(200, cart, "Cart item quantity incremented successfully"));
    } catch (error) {
        console.error("Error incrementing cart item quantity:", error);
        throw new ApiError(500, "Failed to increment cart item quantity");
    }
});


const decrementCartItemQuantity = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { decrementBy = 1 } = req.body;

    if (!isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }
    if (decrementBy <= 0) {
        throw new ApiError(400, "Invalid decrement value");
    }

    try {
        let cart = await Cart.findOne({ cartOwner: req.user._id });

        if (!cart) {
            throw new ApiError(404, "Cart not found");
        }

        const cartItem = cart.cartItems.find(item => item.product.toString() === productId);

        if (!cartItem) {
            throw new ApiError(404, "Product not found in cart");
        }

        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        cartItem.quantity -= decrementBy;

        if (cartItem.quantity <= 0) {
            cart.cartItems = cart.cartItems.filter(item => item.product.toString() !== productId);
        }

        product.productQuantity += decrementBy;

        await Promise.all([
            cart.save(),
            product.save()
        ]);

        return res.status(200).json(new ApiResponse(200, cart, "Cart item quantity decremented successfully"));
    } catch (error) {
        console.error("Error decrementing cart item quantity:", error);
        throw new ApiError(500, "Failed to decrement cart item quantity");
    }
});

export {
    addProductToCart,
    getUserCart,
    removeProductFromCart,
    incrementCartItemQuantity,
    decrementCartItemQuantity
};
