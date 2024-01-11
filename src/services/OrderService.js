const Order = require("../models/OrderProduct")
const Product = require("../models/ProductModel")
const EmailService = require("../services/EmailService")

const createOrder = async (newOrder) => {
    try {
        const {
            orderItems,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            fullName,
            address,
            city,
            phone,
            user,
            isPaid,
            paidAt,
            email
        } = newOrder;
        //Destructuring object newOrder để trích xuất các thuộc tính của đơn hàng.

        //Tạo một mảng các promises dựa trên danh sách orderItems trong đơn hàng.
        const promises = orderItems.map(async (order) => {
            //Tìm và cập nhật một sản phẩm dựa trên _id và kiểm tra số lượng hàng tồn kho.
            const productData = await Product.findOneAndUpdate(
                {
                    _id: order.product,
                    countInStock: { $gte: order.amount }
                },
                {
                    $inc: {
                        countInStock: -order.amount,
                        selled: +order.amount
                    }
                },
                { new: true }
            );
            //Kiểm tra nếu sản phẩm không tồn tại hoặc không đủ hàng.
            if (!productData) {
                return {
                    status: 'ERR',
                    message: 'Không đủ hàng',
                    id: order.product
                };
            }

            return {
                status: 'OK',
                message: 'SUCCESS'
            };
        });
        const results = await Promise.all(promises);
        //Lọc các kết quả để tìm những sản phẩm không đủ hàng.
        const newData = results.filter((item) => item.status === 'ERR');

        if (newData.length) {
            const arrId = newData.map((item) => item.id);
            return {
                status: 'ERR',
                message: `Sản phẩm với ID: ${arrId.join(',')} không đủ hàng`
            };
        }
        //Tạo một đơn hàng mới dựa trên thông tin đã cung cấp.
        const createdOrder = await Order.create({
            orderItems,
            shippingAddress: {
                fullName,
                address,
                city,
                phone
            },
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            user: user,
            isPaid,
            paidAt
        });

        // Uncomment the following block if you want to send an email after order creation
        // if (createdOrder) {
        //     await EmailService.sendEmailCreateOrder(email, orderItems);
        // }

        return {
            status: 'OK',
            message: 'Đặt hàng thành công'
        };
    } catch (e) {
        console.error('Error creating order:', e);
        throw e; // Re-throw the error to propagate it up the call stack
    }
};

// Usage example:
// createOrder(newOrder)
//     .then((result) => console.log(result))
//     .catch((error) => console.error(error));

// const createOrder = (newOrder) => {
//     return new Promise(async (resolve, reject) => {
//         const { orderItems,paymentMethod, itemsPrice, shippingPrice, totalPrice, fullName, address, city, phone,user, isPaid, paidAt,email } = newOrder
//         try {
//             const promises = orderItems.map(async (order) => {
//                 const productData = await Product.findOneAndUpdate(
//                     {
//                     _id: order.product,
//                     countInStock: {$gte: order.amount}
//                     },
//                     {$inc: {
//                         countInStock: -order.amount,
//                         selled: +order.amount
//                     }},
//                     {new: true}
//                 )
//                 if(productData) {
//                     return {
//                         status: 'OK',
//                         message: 'SUCCESS'
//                     }
//                 }
//                  else {
//                     return{
//                         status: 'OK',
//                         message: 'ERR',
//                         id: order.product
//                     }
//                 }
//             })
//             const results = await Promise.all(promises)
//             const newData = results && results.filter((item) => item.id)
//             if(newData.length) {
//                 const arrId = []
//                 newData.forEach((item) => {
//                     arrId.push(item.id)
//                 })
//                 resolve({
//                     status: 'ERR',
//                     message: `San pham voi id: ${arrId.join(',')} khong du hang`
//                 })
//             } else {
//                 const createdOrder = await Order.create({
//                     orderItems,
//                     shippingAddress: {
//                         fullName,
//                         address,
//                         city, phone
//                     },
//                     paymentMethod,
//                     itemsPrice,
//                     shippingPrice,
//                     totalPrice,
//                     user: user,
//                     isPaid, paidAt
//                 })
//                 if (createdOrder) {
//                     await EmailService.sendEmailCreateOrder(email,orderItems)
//                     resolve({
//                         status: 'OK',
//                         message: 'success'
//                     })
//                 }
//             }
//         } catch (e) {
//         //   console.log('e', e)
//             reject(e)
//         }
//     })
// }

// const deleteManyProduct = (ids) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             await Product.deleteMany({ _id: ids })
//             resolve({
//                 status: 'OK',
//                 message: 'Delete product success',
//             })
//         } catch (e) {
//             reject(e)
//         }
//     })
// }

const getAllOrderDetails = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.find({
                user: id
            }).sort({createdAt: -1, updatedAt: -1})
            if (order === null) {
                resolve({
                    status: 'ERR',
                    message: 'The order is not defined'
                })
            }

            resolve({
                status: 'OK',
                message: 'SUCESSS',
                data: order
            })
        } catch (e) {
            // console.log('e', e)
            reject(e)
        }
    })
}

const getOrderDetails = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const order = await Order.findById({
                _id: id
            })
            if (order === null) {
                resolve({
                    status: 'ERR',
                    message: 'The order is not defined'
                })
            }

            resolve({
                status: 'OK',
                message: 'SUCESSS',
                data: order
            })
        } catch (e) {
            // console.log('e', e)
            reject(e)
        }
    })
}

const cancelOrderDetails = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let order = []
            const promises = data.map(async (order) => {
                const productData = await Product.findOneAndUpdate(
                    {
                    _id: order.product,
                    selled: {$gte: order.amount}
                    },
                    {$inc: {
                        countInStock: +order.amount,
                        selled: -order.amount
                    }},
                    {new: true}
                )
                if(productData) {
                    order = await Order.findByIdAndDelete(id)
                    if (order === null) {
                        resolve({
                            status: 'ERR',
                            message: 'The order is not defined'
                        })
                    }
                } else {
                    return{
                        status: 'OK',
                        message: 'ERR',
                        id: order.product
                    }
                }
            })
            const results = await Promise.all(promises)
            const newData = results && results[0] && results[0].id
            
            if(newData) {
                resolve({
                    status: 'ERR',
                    message: `San pham voi id: ${newData} khong ton tai`
                })
            }
            resolve({
                status: 'OK',
                message: 'success',
                data: order
            })
        } catch (e) {
            reject(e)
        }
    })
}

const getAllOrder = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allOrder = await Order.find().sort({createdAt: -1, updatedAt: -1})
            resolve({
                status: 'OK',
                message: 'Success',
                data: allOrder
            })
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    createOrder,
    getAllOrderDetails,
    getOrderDetails,
    cancelOrderDetails,
    getAllOrder
}