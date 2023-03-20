import React from 'react'
import { IFormProps } from './types'
import cn from 'classnames'

export default (props: IFormProps) => {
    const { title, buttonLabel, action, buttonLabel2, action2, loading } = props

    return (
        <div className="form">
            <div className={cn('title', loading ? 'loading' : '')}>
                <p>{title}</p>
            </div>
            <div className="message">{props.children}</div>
            {action && buttonLabel && (
                <button className="actionButton" onClick={action} disabled={loading}>
                    {buttonLabel}
                </button>
            )}
            {action2 && buttonLabel2 && (
                <button className="actionButton" onClick={action2} disabled={loading}>
                    {buttonLabel2}
                </button>
            )}
        </div>
    )
}
